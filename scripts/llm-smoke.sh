#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/smoke-auth.sh"

BASE_URL="${BASE_URL:-https://starkitchen.ai}"
MANAGER_TOKEN="${LLM_MANAGER_TOKEN:-}"
MESSAGE="${LLM_TEST_MESSAGE:-请回复 OK}"
PROVIDER_ID="${LLM_PROVIDER_ID:-deepseek}"
PROVIDER_MODEL="${LLM_PROVIDER_MODEL:-deepseek-chat}"
PROVIDER_API_KEY="${LLM_PROVIDER_API_KEY:-}"
COOKIE_JAR="${LLM_COOKIE_JAR:-/tmp/starkitchen-llm-smoke.cookies.txt}"
SMOKE_AUTO_LOGIN="${SMOKE_AUTO_LOGIN:-1}"
SMOKE_LOGIN_USERNAME="${SMOKE_LOGIN_USERNAME:-${LOCAL_ADMIN_USERNAME:-Marlins}}"
SMOKE_LOGIN_PASSWORD="${SMOKE_LOGIN_PASSWORD:-${LOCAL_ADMIN_PASSWORD:-1234}}"

echo "== LLM smoke test =="
echo "BASE_URL=${BASE_URL}"

if [[ -z "${MANAGER_TOKEN}" && "${SMOKE_AUTO_LOGIN}" == "1" ]]; then
  if ! MANAGER_TOKEN="$(request_login_token "${BASE_URL}" "${SMOKE_LOGIN_USERNAME}" "${SMOKE_LOGIN_PASSWORD}")"; then
    echo "Auto login unavailable. Fallback to unauthenticated auth-gate checks."
    MANAGER_TOKEN=""
  else
    echo "Auto login succeeded. Use embedded auth token for manager checks."
  fi
fi

dashboard_code=$(curl -s -o /dev/null -w '%{http_code}' "${BASE_URL}/dashboard/")
echo "GET /dashboard/ -> ${dashboard_code}"
if [[ "${dashboard_code}" != "200" ]]; then
  echo "Dashboard route failed."
  exit 1
fi

if [[ -n "${MANAGER_TOKEN}" ]]; then
  auth_header="Authorization: Bearer ${MANAGER_TOKEN}"
  control_plane_code=$(curl -s -o /dev/null -w '%{http_code}' -H "${auth_header}" "${BASE_URL}/api/llm/control-plane/")
  echo "GET /api/llm/control-plane/ (authenticated) -> ${control_plane_code}"
  if [[ "${control_plane_code}" != "200" ]]; then
    echo "Control plane route failed."
    exit 1
  fi

  monitor_code=$(curl -s -o /dev/null -w '%{http_code}' -H "${auth_header}" "${BASE_URL}/api/llm/monitor/summary/")
  echo "GET /api/llm/monitor/summary/ -> ${monitor_code}"
  if [[ "${monitor_code}" != "200" ]]; then
    echo "Monitor summary route failed."
    exit 1
  fi

  if [[ -n "${PROVIDER_API_KEY}" ]]; then
    rm -f "${COOKIE_JAR}"
    update_payload=$(printf '{"enabled":true,"defaultModel":"%s","apiKey":"%s","keySource":"cookie","keyEnvVar":"SK_LLM_DEEPSEEK_API_KEY"}' "${PROVIDER_MODEL}" "${PROVIDER_API_KEY}")
    update_code=$(curl -s -o /dev/null -w '%{http_code}' \
      -X PUT \
      -H "${auth_header}" \
      -H 'content-type: application/json' \
      -c "${COOKIE_JAR}" \
      --data "${update_payload}" \
      "${BASE_URL}/api/llm/providers/${PROVIDER_ID}/")
    echo "PUT /api/llm/providers/${PROVIDER_ID}/ -> ${update_code}"
    if [[ "${update_code}" != "200" ]]; then
      echo "Provider update failed."
      exit 1
    fi

    test_code=$(curl -s -o /dev/null -w '%{http_code}' \
      -X POST \
      -H "${auth_header}" \
      -H 'content-type: application/json' \
      -b "${COOKIE_JAR}" \
      -c "${COOKIE_JAR}" \
      --data '{}' \
      "${BASE_URL}/api/llm/providers/${PROVIDER_ID}/test/")
    echo "POST /api/llm/providers/${PROVIDER_ID}/test/ -> ${test_code}"
    if [[ "${test_code}" != "200" ]]; then
      echo "Provider connectivity test failed."
      exit 1
    fi
  fi

  chat_cmd=(curl -s -i --max-time 45 -X POST -H "${auth_header}" -H 'content-type: application/json')
  if [[ -f "${COOKIE_JAR}" ]]; then
    chat_cmd+=(-b "${COOKIE_JAR}" -c "${COOKIE_JAR}")
  fi
  chat_cmd+=(--data "{\"message\":\"${MESSAGE}\"}" "${BASE_URL}/api/chat/completions/")

  chat_raw="$("${chat_cmd[@]}")"
  chat_status=$(printf '%s' "${chat_raw}" | awk 'NR==1 {print $2}')
  echo "POST /api/chat/completions/ -> ${chat_status}"
  if [[ "${chat_status}" != "200" ]]; then
    echo "Chat completion route failed."
    exit 1
  fi

  if printf '%s' "${chat_raw}" | rg -q '^data: \{"error"'; then
    echo "Chat completion stream returned an error payload."
    exit 1
  fi

else
  control_plane_code=$(curl -s -o /dev/null -w '%{http_code}' "${BASE_URL}/api/llm/control-plane/")
  echo "GET /api/llm/control-plane/ (unauthenticated) -> ${control_plane_code}"
  if [[ "${control_plane_code}" != "401" ]]; then
    echo "Control plane route should require auth (expected 401)."
    exit 1
  fi

  chat_noauth_code=$(curl -s -o /dev/null -w '%{http_code}' \
    -X POST \
    -H 'content-type: application/json' \
    --data "{\"message\":\"${MESSAGE}\"}" \
    "${BASE_URL}/api/chat/completions/")
  echo "POST /api/chat/completions/ (unauthenticated) -> ${chat_noauth_code}"
  if [[ "${chat_noauth_code}" != "401" ]]; then
    echo "Chat completion route should require auth (expected 401)."
    exit 1
  fi

  echo "Skip manager-only API checks. Set LLM_MANAGER_TOKEN to enable full smoke."
fi

echo "Smoke test passed."
