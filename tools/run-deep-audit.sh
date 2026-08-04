#!/usr/bin/env bash
# راه‌اندازیِ کاملِ «ممیزیِ عمیقِ واقعی»: یک PostgreSQL موقت + مهاجرت‌ها + کاربرِ ادمینِ seed +
# سرورِ واقعیِ Node را بالا می‌آورد، بعد tools/audit-deep.mjs را روی همان اجرا می‌کند (نه stubِ فیک).
# مخصوصِ محیطِ توسعه/سندباکس. برای اجرا:  bash tools/run-deep-audit.sh [filter]
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$HERE/.." && pwd)"
FILTER="${1:-}"
PGBIN="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)"
[ -z "$PGBIN" ] && { echo "PostgreSQL یافت نشد"; exit 2; }
AUD="${AUDIT_DIR:-/var/tmp/neura-auditdb}"; PGPORT="${AUDIT_PGPORT:-5455}"; APIPORT="${AUDIT_APIPORT:-4300}"
RUNUSER=""; if [ "$(id -u)" = "0" ]; then
  id pgaudit >/dev/null 2>&1 || useradd -M -s /bin/bash pgaudit
  RUNUSER="runuser -u pgaudit --"
fi
psql_(){ $RUNUSER "$PGBIN/psql" -h 127.0.0.1 -p "$PGPORT" -U neura -d neura_audit -tc "$1" 2>&1; }

echo "==> PostgreSQL موقت"
rm -rf "$AUD"; mkdir -p "$AUD"; [ -n "$RUNUSER" ] && chown -R pgaudit "$AUD"; chmod 700 "$AUD"
$RUNUSER "$PGBIN/initdb" -D "$AUD/data" -U neura --auth=trust >/dev/null 2>&1 || { echo "initdb خطا"; exit 2; }
$RUNUSER "$PGBIN/pg_ctl" -D "$AUD/data" -o "-p $PGPORT -k $AUD -c listen_addresses=127.0.0.1" -l "$AUD/pg.log" start >/dev/null 2>&1
sleep 2; $RUNUSER "$PGBIN/createdb" -h 127.0.0.1 -p "$PGPORT" -U neura neura_audit >/dev/null 2>&1
psql_ "SELECT 1" >/dev/null || { echo "PG بالا نیامد"; cat "$AUD/pg.log"; exit 2; }

export DATABASE_URL="postgres://neura@127.0.0.1:$PGPORT/neura_audit"
export JWT_SECRET="audit-secret" WEB_CONCURRENCY=1 PORT="$APIPORT" RTC_PORT="$((APIPORT+1))"

echo "==> مهاجرت‌ها"
( cd "$REPO/server" && node src/migrate.js ) >/dev/null 2>&1 || { echo "migrate خطا"; exit 2; }

echo "==> سرورِ واقعیِ Node"
( cd "$REPO/server" && nohup node src/server.js > "$AUD/server.log" 2>&1 & echo $! > "$AUD/server.pid" )
sleep 4
curl -s "http://127.0.0.1:$APIPORT/api/health" | grep -q '"ok":true' || { echo "سرور بالا نیامد"; cat "$AUD/server.log" | tail; exit 2; }

echo "==> کاربرِ ادمینِ ممیزی"
curl -s -X POST "http://127.0.0.1:$APIPORT/api/auth/register" -H 'Content-Type: application/json' \
  -d '{"username":"audituser","password":"audit123","name":"کاربر ممیزی"}' >/dev/null
psql_ "UPDATE app_users SET role='admin', company='auditco' WHERE username='audituser'" >/dev/null

echo "==> ممیزیِ عمیق"
( cd "$REPO/front" && [ -f dist/index.html ] || npx --no-install vite build >/dev/null 2>&1 )
SERVER_URL="http://127.0.0.1:$APIPORT" node "$REPO/tools/audit-deep.mjs" "$FILTER"
RC=$?

echo "==> پاک‌سازی"
[ -f "$AUD/server.pid" ] && kill "$(cat "$AUD/server.pid")" 2>/dev/null
$RUNUSER "$PGBIN/pg_ctl" -D "$AUD/data" stop >/dev/null 2>&1
exit $RC
