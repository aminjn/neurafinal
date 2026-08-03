#!/usr/bin/env bash
# ============================================================
#  دیپلویِ Neura از ریپوی واحدِ neurafinal (بدونِ پچر).
#  مسیرهای سرویس‌دهیِ nginx/systemd دست‌نخورده می‌مانند:
#    فرانتِ کاربر  → /opt/neuravergh/dist
#    سوپرادمین     → /opt/neuravergh/admin/dist   (base=/admin/)
#    سرورِ Node    → /opt/neura-ui/server         (سرویسِ neura-api ؛ .env همان‌جا می‌مانَد)
#  استفاده (روی سرور):
#    D=/opt/neurafinal; [ -d $D/.git ] && git -C $D pull --ff-only || git clone https://github.com/aminjn/neurafinal.git $D
#    sudo bash $D/deploy.sh
# ============================================================
set -euo pipefail
REPO="$(cd "$(dirname "$0")" && pwd)"
SERVE="${SERVE_DIR:-/opt/neuravergh}"          # nginx root فرانت (dist داخلش)
ADMIN="${ADMIN_DIR:-/opt/neuravergh/admin}"     # nginx root سوپرادمین
SRV="${SERVER_DIR:-/opt/neura-ui/server}"       # مسیرِ سرویسِ Node (شاملِ .env)
log(){ echo -e "\n\033[1;36m==> $*\033[0m"; }

publish(){ # $1=build-dir  $2=serve-dir : جایگزینیِ کم‌ریسک (build کنار، بعد swap)
  mkdir -p "$2"; rm -rf "$2/dist.new"; cp -r "$1" "$2/dist.new"
  rm -rf "$2/dist.old"; [ -d "$2/dist" ] && mv "$2/dist" "$2/dist.old" || true
  mv "$2/dist.new" "$2/dist"
}

log "۱) فرانتِ کاربر — build"
cd "$REPO/front"
npm install --no-audit --no-fund >/dev/null 2>&1
npx --no-install vite build 2>/dev/null || ./node_modules/.bin/vite build
# assetهای مسیرِ رشته‌ای (لوگو/آواتار/آیکون) که Vite bundle نمی‌کند را کنارِ dist بگذار
mkdir -p dist/src
for d in assets avatars icons; do [ -d "src/$d" ] && cp -r "src/$d" "dist/src/$d"; done
# aliasِ fw*→w* (رفعِ ۴۰۴ِ آواتارها)
if [ -d dist/src/avatars ]; then
  for f in dist/src/avatars/fw*.png; do [ -f "$f" ] && cp -n "$f" "${f/\/fw/\/w}" || true; done
fi
# preloadِ فونت‌های FontAwesome (رفعِ آیکونِ نامرئی)
FASOLID="$(ls -1 dist/assets/fa-solid-900-*.woff2 2>/dev/null | head -1 | xargs -r basename || true)"
if [ -n "${FASOLID:-}" ] && [ -f dist/index.html ] && ! grep -q "fa-solid-900-.*preload" dist/index.html; then
  PRE="<link rel=\"preload\" as=\"font\" type=\"font/woff2\" crossorigin href=\"/assets/${FASOLID}\">"
  sed -i "s#</head>#${PRE}</head>#" dist/index.html
fi
publish "$REPO/front/dist" "$SERVE"
echo "  ✅ فرانت منتشر شد → $SERVE/dist"

log "۲) سوپرادمین — build"
cd "$REPO/front/admin"
NODE_ENV=development npm install --no-audit --no-fund --legacy-peer-deps --include=dev >/dev/null 2>&1
npx --no-install vite build 2>/dev/null || ./node_modules/.bin/vite build
publish "$REPO/front/admin/dist" "$ADMIN"
echo "  ✅ سوپرادمین منتشر شد → $ADMIN/dist"

log "۳) سرورِ Node — به‌روزرسانیِ کد (‏.env و node_modules دست‌نخورده)"
rsync -a --exclude='.env' --exclude='.env.*' --exclude='node_modules' --exclude='.git' \
  "$REPO/server/" "$SRV/"
( cd "$SRV" && npm install --no-audit --no-fund >/dev/null 2>&1 )
# مایگریشنِ شِما (بی‌خطر؛ دادهٔ کاربر پاک نمی‌شود)
if [ -f "$SRV/.env" ]; then
  ( cd "$SRV" && set -a && . ./.env && set +a && node src/migrate.js ) && echo "  ✅ migrate" || echo "  ⚠️ migrate دستی لازم است"
fi

log "۴) ری‌استارتِ سرویس"
if command -v systemctl >/dev/null 2>&1; then
  sudo systemctl restart neura-api && echo "  ✅ neura-api ری‌استارت شد" || echo "  ⚠️ دستی: sudo systemctl restart neura-api"
fi

log "تمام ✅ دیپلوی از neurafinal کامل شد. در مرورگر Ctrl+Shift+R."
