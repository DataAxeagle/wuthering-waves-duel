#!/usr/bin/env bash
set -euo pipefail

PACKAGE_PATH="${1:?usage: install-first.sh PACKAGE_PATH [PUBLIC_ORIGIN]}"
PUBLIC_ORIGIN="${2:-http://49.234.54.14}"
EXPECTED_SHA256="${EXPECTED_SHA256:-}"

if [[ ! -f "$PACKAGE_PATH" ]]; then
  echo "package not found: $PACKAGE_PATH" >&2
  exit 1
fi

if [[ -n "$EXPECTED_SHA256" ]]; then
  ACTUAL_SHA256="$(sha256sum "$PACKAGE_PATH" | awk '{print toupper($1)}')"
  if [[ "$ACTUAL_SHA256" != "${EXPECTED_SHA256^^}" ]]; then
    echo "package sha256 mismatch" >&2
    exit 1
  fi
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl gnupg nginx unzip

if ! command -v node >/dev/null 2>&1 || [[ "$(node -p 'Number(process.versions.node.split(`.`)[0])')" -lt 24 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_24.x -o /tmp/nodesource_setup.sh
  bash /tmp/nodesource_setup.sh
  apt-get install -y nodejs
fi

if ! id wavesduel >/dev/null 2>&1; then
  useradd --system --home-dir /opt/waves-duel --shell /usr/sbin/nologin wavesduel
fi

install -d -m 0755 /opt/waves-duel
install -d -o wavesduel -g wavesduel -m 0750 /opt/waves-duel/data

RELEASE_DIR="/opt/waves-duel/releases/$(date +%Y%m%d-%H%M%S)"
install -d -m 0755 "$RELEASE_DIR"
case "$PACKAGE_PATH" in
  *.tar.gz|*.tgz) tar -xzf "$PACKAGE_PATH" -C "$RELEASE_DIR" ;;
  *.zip) unzip -q "$PACKAGE_PATH" -d "$RELEASE_DIR" ;;
  *) echo "unsupported package format: $PACKAGE_PATH" >&2; exit 1 ;;
esac

for link_path in /opt/waves-duel/mobile /opt/waves-duel/tencent-server /opt/waves-duel/supabase; do
  if [[ -e "$link_path" || -L "$link_path" ]]; then
    echo "refusing to replace existing path without a release upgrade: $link_path" >&2
    exit 1
  fi
done
ln -s "$RELEASE_DIR/mobile" /opt/waves-duel/mobile
ln -s "$RELEASE_DIR/tencent-server" /opt/waves-duel/tencent-server
ln -s "$RELEASE_DIR/supabase" /opt/waves-duel/supabase

cd /opt/waves-duel/tencent-server
npm ci --omit=dev

if [[ ! -f .env ]]; then
  umask 077
  SESSION_SECRET="$(openssl rand -base64 48 | tr -d '\n')"
  {
    printf 'HOST=127.0.0.1\n'
    printf 'PORT=8787\n'
    printf 'PUBLIC_ORIGIN=%s\n' "$PUBLIC_ORIGIN"
    printf 'MOBILE_ROOT=/opt/waves-duel/mobile\n'
    printf 'DATA_DIR=/opt/waves-duel/data\n'
    printf 'PVP_SESSION_SECRET=%s\n' "$SESSION_SECRET"
  } > .env
fi

chown -R root:root "$RELEASE_DIR"
chown wavesduel:wavesduel /opt/waves-duel/data
chmod 0700 /opt/waves-duel/tencent-server/.env

install -m 0644 /opt/waves-duel/tencent-server/deploy/waves-duel-pvp.service /etc/systemd/system/waves-duel-pvp.service
if [[ -f /etc/nginx/sites-available/default ]]; then
  cp -a /etc/nginx/sites-available/default "/etc/nginx/sites-available/default.backup-$(date +%Y%m%d-%H%M%S)"
fi
install -m 0644 /opt/waves-duel/tencent-server/deploy/nginx-http.conf /etc/nginx/sites-available/default

systemctl daemon-reload
systemctl enable --now waves-duel-pvp
nginx -t
systemctl enable --now nginx
systemctl reload nginx

curl --fail --silent --show-error http://127.0.0.1:8787/api/status >/dev/null
echo "DEPLOY_READY release=$RELEASE_DIR node=$(node --version)"
