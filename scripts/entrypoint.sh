#!/bin/sh
set -e

: "${DATA_DIR:=/app/data}"
export DATA_DIR

mkdir -p "${DATA_DIR}/uploads"

node /app/scripts/init-db.mjs

exec node /app/server.js
