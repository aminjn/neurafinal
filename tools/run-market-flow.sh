#!/usr/bin/env bash
# R19 — راه‌اندازیِ کاملِ «تستِ پروسهٔ مارکت»: PostgreSQL موقت + سرورِ واقعی + خریدارِ audituser + بذرِ
# دادهٔ واقعی (فروشنده/محصول/رستوران/پیشنهاد) + اجرای audit-market-flow.mjs (پیمایشِ تب‌ها + خریدِ واقعی تا آخر).
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$HERE/.." && pwd)"
PGBIN="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)"
[ -z "$PGBIN" ] && { echo "PostgreSQL یافت نشد"; exit 2; }
AUD="${AUDIT_DIR:-/var/tmp/neura-marketdb}"; PGPORT="${AUDIT_PGPORT:-5456}"; APIPORT="${AUDIT_APIPORT:-4320}"
RUNUSER=""; if [ "$(id -u)" = "0" ]; then id pgaudit >/dev/null 2>&1 || useradd -M -s /bin/bash pgaudit; RUNUSER="runuser -u pgaudit --"; fi
psql_(){ $RUNUSER "$PGBIN/psql" -h 127.0.0.1 -p "$PGPORT" -U neura -d neura_audit -tc "$1" 2>&1; }

echo "==> PostgreSQL موقت"
rm -rf "$AUD"; mkdir -p "$AUD"; [ -n "$RUNUSER" ] && chown -R pgaudit "$AUD"; chmod 700 "$AUD"
$RUNUSER "$PGBIN/initdb" -D "$AUD/data" -U neura --auth=trust >/dev/null 2>&1 || { echo "initdb خطا"; exit 2; }
$RUNUSER "$PGBIN/pg_ctl" -D "$AUD/data" -o "-p $PGPORT -k $AUD -c listen_addresses=127.0.0.1" -l "$AUD/pg.log" start >/dev/null 2>&1
sleep 2; $RUNUSER "$PGBIN/createdb" -h 127.0.0.1 -p "$PGPORT" -U neura neura_audit >/dev/null 2>&1
psql_ "SELECT 1" >/dev/null || { echo "PG بالا نیامد"; cat "$AUD/pg.log"; exit 2; }

export DATABASE_URL="postgres://neura@127.0.0.1:$PGPORT/neura_audit"
export JWT_SECRET="audit-secret" WEB_CONCURRENCY=1 PORT="$APIPORT" RTC_PORT="$((APIPORT+1))"
( cd "$REPO/server" && node src/migrate.js ) >/dev/null 2>&1 || { echo "migrate خطا"; exit 2; }
( cd "$REPO/server" && nohup node src/server.js > "$AUD/server.log" 2>&1 & echo $! > "$AUD/server.pid" )
sleep 4
curl -s "http://127.0.0.1:$APIPORT/api/health" | grep -q '"ok":true' || { echo "سرور بالا نیامد"; tail "$AUD/server.log"; exit 2; }

echo "==> خریدارِ audituser"
curl -s -X POST "http://127.0.0.1:$APIPORT/api/auth/register" -H 'Content-Type: application/json' \
  -d '{"username":"audituser","password":"audit123","name":"خریدارِ ممیزی"}' >/dev/null

echo "==> بذرِ دادهٔ واقعی (فروشنده/محصول/رستوران/پیشنهاد)"
( cd "$REPO" && node tools/audit-seed.mjs ) || { echo "seed خطا"; }

echo "==> [ ! ] بیلد در صورتِ نبودِ dist"
( cd "$REPO/front" && [ -f dist/index.html ] || npx --no-install vite build >/dev/null 2>&1 )

echo "==> تستِ پروسهٔ مارکت (پیمایشِ تب‌ها + خریدِ واقعی)"
SERVER_URL="http://127.0.0.1:$APIPORT" node "$REPO/tools/audit-market-flow.mjs"
RC=$?

echo "==> تأییدِ سمتِ فروشنده (both-role): فروش/کیف‌پول/نوتیف"
psql_ "SELECT 'seller_wallet=' || (meta->'wallet'->>'balance') FROM app_users WHERE username='audiseller'"
psql_ "SELECT 'seller_sale_orders=' || count(*) FROM documents d JOIN app_users u ON d.company='user:'||u.id WHERE u.username='audiseller' AND d.collection='u_orders' AND d.data->>'kind'='sale'"
psql_ "SELECT 'seller_notifs=' || count(*) FROM documents d JOIN app_users u ON d.company='user:'||u.id WHERE u.username='audiseller' AND d.collection='u_notifications'"

echo "==> پاک‌سازی"
[ -f "$AUD/server.pid" ] && kill "$(cat "$AUD/server.pid")" 2>/dev/null
$RUNUSER "$PGBIN/pg_ctl" -D "$AUD/data" stop >/dev/null 2>&1
exit $RC
