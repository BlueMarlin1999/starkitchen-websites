#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://starkitchen.ai}"
SMOKE_AUTO_LOGIN="${SMOKE_AUTO_LOGIN:-1}"

echo "== SK quality preflight =="
echo "BASE_URL=${BASE_URL}"
echo "SMOKE_AUTO_LOGIN=${SMOKE_AUTO_LOGIN}"

npm run quality:run
npm run build

BASE_URL="${BASE_URL}" SMOKE_AUTO_LOGIN="${SMOKE_AUTO_LOGIN}" npm run test:oa-smoke
BASE_URL="${BASE_URL}" SMOKE_AUTO_LOGIN="${SMOKE_AUTO_LOGIN}" npm run test:ai-workflow-smoke
BASE_URL="${BASE_URL}" SMOKE_AUTO_LOGIN="${SMOKE_AUTO_LOGIN}" npm run test:llm-smoke

echo "Preflight passed."
