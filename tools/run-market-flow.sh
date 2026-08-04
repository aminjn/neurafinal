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

# سرورهای زامبیِ اجراهای قبلی را ببند (وگرنه پورت را نگه می‌دارند و curl به کدِ قدیمی می‌خورد → 403/باگِ کاذب)
pkill -9 -f "node src/server.js" 2>/dev/null; sleep 2

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

echo "==> تستِ نظر+مرجوعی+بازپرداخت (end-to-end, both-role)"
API="http://127.0.0.1:$APIPORT/api"
BT=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' -d '{"username":"audituser","password":"audit123"}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
ST=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' -d '{"username":"audiseller","password":"seller123"}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
OID=$(curl -s "$API/shop/orders" -H "Authorization: Bearer $BT" | sed -n 's/.*"id":"\(ord_[^"]*\)".*/\1/p' | head -1)
echo "buyerToken=${BT:0:8}… sellerToken=${ST:0:8}… orderId=$OID"
echo "-- ثبتِ نظر (خریدارِ واقعی):"; curl -s -X POST "$API/shop/product/review" -H "Authorization: Bearer $BT" -H 'Content-Type: application/json' -d '{"sellerId":"2","productId":"1001","rating":5,"text":"عالی بود"}' | head -c 200; echo
echo "-- درخواستِ مرجوعی (خریدار):"; curl -s -X POST "$API/shop/order/return" -H "Authorization: Bearer $BT" -H 'Content-Type: application/json' -d "{\"orderId\":\"$OID\",\"reason\":\"کالا معیوب بود\"}" | head -c 200; echo
RID=$(curl -s "$API/shop/returns" -H "Authorization: Bearer $ST" | sed -n 's/.*"id":"\(ret_[^"]*\)".*/\1/p' | head -1)
echo "-- returnId=$RID → تأییدِ فروشنده (بازپرداختِ اتمیک):"; curl -s -X POST "$API/shop/return/resolve" -H "Authorization: Bearer $ST" -H 'Content-Type: application/json' -d "{\"returnId\":\"$RID\",\"approve\":true}" | head -c 200; echo
echo "-- R21: پیگیریِ واقعی از فروشنده (اکتِ ایجنت) — قبلِ مرجوعی باید سفارش هنوز باشد؛ این را زودتر می‌زنیم:"
echo "   (نکته: چون بالا مرجوعی زدیم، برای تستِ پیگیری یک خریدِ تازه لازم نیست — follow_up آخرین سفارشِ non-sale را می‌گیرد)"
FUP=$(curl -s -X POST "$API/ai/order/follow-up" -H "Authorization: Bearer $BT" -H 'Content-Type: application/json' -d '{}')
echo "   follow-up resp: $(echo "$FUP" | head -c 160)"
psql_ "SELECT 'seller_followup_notifs=' || count(*) FROM documents d JOIN app_users u ON d.company='user:'||u.id WHERE u.username='audiseller' AND d.collection='u_notifications' AND d.data->>'type'='order_followup'"

echo "-- SQL: امتیازِ محصول / موجودیِ خریدار پس از بازپرداخت / وضعیتِ سفارش:"
psql_ "SELECT 'reviews=' || count(*) FROM documents WHERE collection='u_product_reviews'"
psql_ "SELECT 'buyer_wallet=' || (meta->'wallet'->>'balance') FROM app_users WHERE username='audituser'"
psql_ "SELECT 'order_status=' || (data->>'status') FROM documents d JOIN app_users u ON d.company='user:'||u.id WHERE u.username='audituser' AND d.collection='u_orders' AND d.data->>'kind'<>'sale' LIMIT 1"

echo "-- تیکِ خوانده‌شدِ واقعی (peer read receipt): A→B، B می‌خواند، A باید readAt ببیند"
curl -s -X POST "$API/peer/send" -H "Authorization: Bearer $BT" -H 'Content-Type: application/json' -d '{"to":"2","text":"سلام تست"}' >/dev/null
echo "   قبلِ خواندن: $(curl -s "$API/peer/with?sub=2" -H "Authorization: Bearer $BT" | grep -o 'readAt' | head -1 || echo 'بدونِ readAt (تیکِ تکی=ارسال‌شد) ✓')"
curl -s -X POST "$API/peer/read" -H "Authorization: Bearer $ST" -H 'Content-Type: application/json' -d '{"sub":"1"}' >/dev/null
echo "   بعدِ خواندن: $(curl -s "$API/peer/with?sub=2" -H "Authorization: Bearer $BT" | grep -o 'readAt":[0-9]*' | head -1 || echo 'NOT-READ ✗')"

echo "-- تنظیماتِ ۱:۱ واقعی (بلاک/بی‌صدا): B کاربر A را بلاک می‌کند، پیامِ A باید رد شود"
curl -s -X POST "$API/peer/block" -H "Authorization: Bearer $ST" -H 'Content-Type: application/json' -d '{"sub":"1","block":true}' >/dev/null
echo "   ارسالِ A بعد از بلاک: $(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/peer/send" -H "Authorization: Bearer $BT" -H 'Content-Type: application/json' -d '{"to":"2","text":"بعد از بلاک"}') (باید 403)"
echo "   info نزدِ B: $(curl -s "$API/peer/info?sub=1" -H "Authorization: Bearer $ST" | grep -o '"blocked":[a-z]*')"
curl -s -X POST "$API/peer/block" -H "Authorization: Bearer $ST" -H 'Content-Type: application/json' -d '{"sub":"1","block":false}' >/dev/null
curl -s -X POST "$API/peer/mute" -H "Authorization: Bearer $ST" -H 'Content-Type: application/json' -d '{"sub":"1","mute":true,"durationMs":3600000}' >/dev/null
echo "   بی‌صدا: $(curl -s "$API/peer/info?sub=1" -H "Authorization: Bearer $ST" | grep -o '"muteUntil":[0-9]*' || echo 'no-mute')"

echo "-- عکس/ویس + لاگِ تماس (چت):"
IMG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
echo "   ارسالِ عکس: $(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/peer/send" -H "Authorization: Bearer $BT" -H 'Content-Type: application/json' -d "{\"to\":\"2\",\"media\":{\"kind\":\"image\",\"data\":\"$IMG\"}}") (باید 201)"
echo "   دریافتِ مدیا نزدِ گیرنده: $(curl -s "$API/peer/with?sub=1" -H "Authorization: Bearer $ST" | grep -o '"kind":"image"' | head -1 || echo 'no-media')"
curl -s -X POST "$API/peer/call-log" -H "Authorization: Bearer $BT" -H 'Content-Type: application/json' -d '{"peerSub":"2","peerName":"فروشنده","kind":"audio","direction":"out","duration":42}' >/dev/null
echo "   لاگِ تماس: $(curl -s "$API/peer/call-log" -H "Authorization: Bearer $BT" | grep -o '"duration":42' | head -1 || echo 'no-log')"

echo "==> پاک‌سازی"
[ -f "$AUD/server.pid" ] && kill "$(cat "$AUD/server.pid")" 2>/dev/null
$RUNUSER "$PGBIN/pg_ctl" -D "$AUD/data" stop >/dev/null 2>&1
exit $RC
