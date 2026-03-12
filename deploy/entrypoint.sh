#!/bin/sh
set -eu

WEBROOT="/usr/share/nginx/html"
TARGET="${WEBROOT}/config.js"
TEMPLATE="${WEBROOT}/config.template.js"
MOUNTED="/config/config.js"

if [ -f "$MOUNTED" ]; then
  cp "$MOUNTED" "$TARGET"
else
  : "${SCHREVIND_API_URL:=/api}"
  envsubst < "$TEMPLATE" > "$TARGET"
fi

exec nginx -g 'daemon off;'