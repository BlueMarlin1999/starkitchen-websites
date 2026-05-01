#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/smoke-auth.sh"

BASE_URL="${BASE_URL:-https://www.starkitchen.works}"
MANAGER_TOKEN="${LLM_MANAGER_TOKEN:-}"
COOKIE_JAR="${AI_WORKFLOW_COOKIE_JAR:-/tmp/starkitchen-ai-workflow-smoke.cookies.txt}"
AI_SMOKE_MEDIA="${AI_SMOKE_MEDIA:-0}"
AI_SMOKE_MEDIA_TYPE="${AI_SMOKE_MEDIA_TYPE:-image}"
AI_SMOKE_MEDIA_PROVIDER="${AI_SMOKE_MEDIA_PROVIDER:-openai}"
AI_SMOKE_MEDIA_MODEL="${AI_SMOKE_MEDIA_MODEL:-gpt-image-1}"
AI_SMOKE_MEDIA_PROMPT="${AI_SMOKE_MEDIA_PROMPT:-生成一张星厨集团供应链可视化海报，蓝色科技风。}"
AI_SMOKE_MEDIA_API_KEY="${AI_SMOKE_MEDIA_API_KEY:-${LLM_PROVIDER_API_KEY:-}}"
SMOKE_AUTO_LOGIN="${SMOKE_AUTO_LOGIN:-1}"
SMOKE_LOGIN_USERNAME="${SMOKE_LOGIN_USERNAME:-${LOCAL_ADMIN_USERNAME:-Marlins}}"
SMOKE_LOGIN_PASSWORD="${SMOKE_LOGIN_PASSWORD:-${LOCAL_ADMIN_PASSWORD:-1234}}"

resolve_key_env_var() {
  case "${1}" in
    openai) echo "OPENAI_API_KEY" ;;
    deepseek) echo "DEEPSEEK_API_KEY" ;;
    moonshot) echo "MOONSHOT_API_KEY" ;;
    anthropic) echo "ANTHROPIC_API_KEY" ;;
    openrouter) echo "OPENROUTER_API_KEY" ;;
    ollama) echo "OLLAMA_API_KEY" ;;
    *) echo "LLM_PROVIDER_API_KEY" ;;
  esac
}

echo "== AI workflow smoke test =="
echo "BASE_URL=${BASE_URL}"

if [[ -z "${MANAGER_TOKEN}" && "${SMOKE_AUTO_LOGIN}" == "1" ]]; then
  if ! MANAGER_TOKEN="$(request_login_token "${BASE_URL}" "${SMOKE_LOGIN_USERNAME}" "${SMOKE_LOGIN_PASSWORD}")"; then
    echo "Auto login unavailable. Fallback to unauthenticated auth-gate checks."
    MANAGER_TOKEN=""
  else
    echo "Auto login succeeded. Use embedded auth token for workflow checks."
  fi
fi

if [[ -z "${MANAGER_TOKEN}" ]]; then
  workflow_code=$(curl -s -o /dev/null -w '%{http_code}' "${BASE_URL}/api/ai/workflows/")
  echo "GET /api/ai/workflows/ (unauthenticated) -> ${workflow_code}"
  if [[ "${workflow_code}" != "401" ]]; then
    echo "Expected 401 for unauthenticated workflow list."
    exit 1
  fi

  media_code=$(curl -s -o /dev/null -w '%{http_code}' \
    -X POST \
    -H 'content-type: application/json' \
    --data '{"prompt":"smoke","mediaType":"image"}' \
    "${BASE_URL}/api/ai/media/generate/")
  echo "POST /api/ai/media/generate/ (unauthenticated) -> ${media_code}"
  if [[ "${media_code}" != "401" ]]; then
    echo "Expected 401 for unauthenticated media generation."
    exit 1
  fi

  echo "Smoke test passed (auth gate checks only)."
  exit 0
fi

auth_header="Authorization: Bearer ${MANAGER_TOKEN}"
rm -f "${COOKIE_JAR}"

workflow_list_code=$(curl -s -o /dev/null -w '%{http_code}' \
  -H "${auth_header}" \
  -c "${COOKIE_JAR}" \
  -b "${COOKIE_JAR}" \
  "${BASE_URL}/api/ai/workflows/")
echo "GET /api/ai/workflows/ -> ${workflow_list_code}"
if [[ "${workflow_list_code}" != "200" ]]; then
  echo "Workflow list failed."
  exit 1
fi

create_payload='{"capabilityId":"report_summary","prompt":"请总结本周门店经营报告并给出3条行动建议。","routeId":"long_context","providerId":"moonshot","model":"moonshot-v1-128k","owner":"smoke-test"}'
create_raw=$(curl -sS -i \
  -X POST \
  -H "${auth_header}" \
  -H 'content-type: application/json' \
  -c "${COOKIE_JAR}" \
  -b "${COOKIE_JAR}" \
  --data "${create_payload}" \
  "${BASE_URL}/api/ai/workflows/")
create_status=$(printf '%s' "${create_raw}" | awk 'NR==1 {print $2}')
echo "POST /api/ai/workflows/ -> ${create_status}"
if [[ "${create_status}" != "201" ]]; then
  echo "Workflow create failed."
  exit 1
fi

workflow_id=$(printf '%s' "${create_raw}" | rg -o '"id":"awf-[^"]+"' | head -n 1 | sed 's/"id":"//;s/"$//')
if [[ -z "${workflow_id}" ]]; then
  echo "Cannot parse created workflow id."
  exit 1
fi
echo "workflow_id=${workflow_id}"

approve_raw=$(curl -sS -i \
  -X PATCH \
  -H "${auth_header}" \
  -H 'content-type: application/json' \
  -c "${COOKIE_JAR}" \
  -b "${COOKIE_JAR}" \
  --data '{"status":"approved","note":"smoke approved","approver":"smoke"}' \
  "${BASE_URL}/api/ai/workflows/${workflow_id}/")
approve_status=$(printf '%s' "${approve_raw}" | awk 'NR==1 {print $2}')
echo "PATCH /api/ai/workflows/${workflow_id}/ -> ${approve_status}"
if [[ "${approve_status}" != "200" ]]; then
  echo "Workflow approve failed."
  exit 1
fi

if [[ "${AI_SMOKE_MEDIA}" == "1" ]]; then
  if [[ -n "${AI_SMOKE_MEDIA_API_KEY}" ]]; then
    media_key_env_var="$(resolve_key_env_var "${AI_SMOKE_MEDIA_PROVIDER}")"
    provider_payload=$(printf '{"enabled":true,"defaultModel":"%s","apiKey":"%s","keySource":"cookie","keyEnvVar":"%s"}' \
      "${AI_SMOKE_MEDIA_MODEL}" \
      "${AI_SMOKE_MEDIA_API_KEY}" \
      "${media_key_env_var}")
    provider_update_code=$(curl -s -o /dev/null -w '%{http_code}' \
      -X PUT \
      -H "${auth_header}" \
      -H 'content-type: application/json' \
      -c "${COOKIE_JAR}" \
      -b "${COOKIE_JAR}" \
      --data "${provider_payload}" \
      "${BASE_URL}/api/llm/providers/${AI_SMOKE_MEDIA_PROVIDER}/")
    echo "PUT /api/llm/providers/${AI_SMOKE_MEDIA_PROVIDER}/ -> ${provider_update_code}"
    if [[ "${provider_update_code}" != "200" ]]; then
      echo "Media provider update failed."
      exit 1
    fi

    provider_test_code=$(curl -s -o /dev/null -w '%{http_code}' \
      -X POST \
      -H "${auth_header}" \
      -H 'content-type: application/json' \
      -c "${COOKIE_JAR}" \
      -b "${COOKIE_JAR}" \
      --data '{}' \
      "${BASE_URL}/api/llm/providers/${AI_SMOKE_MEDIA_PROVIDER}/test/")
    echo "POST /api/llm/providers/${AI_SMOKE_MEDIA_PROVIDER}/test/ -> ${provider_test_code}"
    if [[ "${provider_test_code}" != "200" ]]; then
      echo "Media provider connectivity test failed."
      exit 1
    fi
  fi

  media_payload=$(printf '{"prompt":"%s","mediaType":"%s","provider":"%s","model":"%s","workflowId":"%s"}' \
    "${AI_SMOKE_MEDIA_PROMPT}" \
    "${AI_SMOKE_MEDIA_TYPE}" \
    "${AI_SMOKE_MEDIA_PROVIDER}" \
    "${AI_SMOKE_MEDIA_MODEL}" \
    "${workflow_id}")
  media_raw=$(curl -sS -i --max-time 120 \
    -X POST \
    -H "${auth_header}" \
    -H 'content-type: application/json' \
    -c "${COOKIE_JAR}" \
    -b "${COOKIE_JAR}" \
    --data "${media_payload}" \
    "${BASE_URL}/api/ai/media/generate/")
  media_status=$(printf '%s' "${media_raw}" | awk 'NR==1 {print $2}')
  echo "POST /api/ai/media/generate/ -> ${media_status}"
  if [[ "${media_status}" != "200" ]]; then
    echo "Media generation smoke failed."
    exit 1
  fi
else
  echo "Skip media generation smoke (set AI_SMOKE_MEDIA=1 to enable)."
fi

echo "AI workflow smoke test passed."
