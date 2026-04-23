#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/smoke-auth.sh"

BASE_URL="${BASE_URL:-https://starkitchen.ai}"
MANAGER_TOKEN="${OA_MANAGER_TOKEN:-${LLM_MANAGER_TOKEN:-}}"
TMP_DIR="${OA_SMOKE_TMP_DIR:-/tmp/starkitchen-oa-smoke}"
SMOKE_AUTO_LOGIN="${SMOKE_AUTO_LOGIN:-1}"
SMOKE_LOGIN_USERNAME="${SMOKE_LOGIN_USERNAME:-${LOCAL_ADMIN_USERNAME:-Marlins}}"
SMOKE_LOGIN_PASSWORD="${SMOKE_LOGIN_PASSWORD:-${LOCAL_ADMIN_PASSWORD:-1234}}"
ACTOR_ID="${OA_ACTOR_ID:-${SMOKE_LOGIN_USERNAME:-local-admin}}"
RETRY_ATTEMPTS="${OA_SMOKE_RETRY_ATTEMPTS:-5}"
RETRY_DELAY_SECONDS="${OA_SMOKE_RETRY_DELAY_SECONDS:-1}"
# "林总" (URL encoded) for header-safe transmission.
ACTOR_NAME_ENCODED="${OA_ACTOR_NAME_ENCODED:-%E6%9E%97%E6%80%BB}"
ACTOR_ROLE="${OA_ACTOR_ROLE:-ceo}"

mkdir -p "${TMP_DIR}"

echo "== OA smoke test =="
echo "BASE_URL=${BASE_URL}"

if [[ -z "${MANAGER_TOKEN}" && "${SMOKE_AUTO_LOGIN}" == "1" ]]; then
  if ! MANAGER_TOKEN="$(request_login_token "${BASE_URL}" "${SMOKE_LOGIN_USERNAME}" "${SMOKE_LOGIN_PASSWORD}")"; then
    echo "Auto login unavailable. Fallback to unauthenticated auth-gate checks."
    MANAGER_TOKEN=""
  else
    echo "Auto login succeeded. Use embedded auth token for OA checks."
  fi
fi

request_status() {
  local url="$1"
  shift

  local status
  status=$(curl -sS -o /dev/null -w '%{http_code}' "$@" "${url}")
  local rc=$?
  if [[ ${rc} -ne 0 ]]; then
    echo "Request failed: ${url}" >&2
    return 1
  fi
  printf '%s' "${status}"
}

request_status_with_retry() {
  local expected="$1"
  local url="$2"
  shift 2

  local attempt=1
  local status=''
  while [[ ${attempt} -le ${RETRY_ATTEMPTS} ]]; do
    status=$(request_status "${url}" "$@") || return 1
    if [[ "${status}" == "${expected}" ]]; then
      printf '%s' "${status}"
      return 0
    fi
    if [[ ${attempt} -lt ${RETRY_ATTEMPTS} ]]; then
      sleep "${RETRY_DELAY_SECONDS}"
    fi
    attempt=$((attempt + 1))
  done

  printf '%s' "${status}"
  return 0
}

request_body_with_retry() {
  local url="$1"
  local pattern="$2"
  shift 2

  local attempt=1
  local body=''
  while [[ ${attempt} -le ${RETRY_ATTEMPTS} ]]; do
    if ! body=$(curl -sS "$@" "${url}"); then
      return 1
    fi
    if printf '%s' "${body}" | rg -q "${pattern}"; then
      printf '%s' "${body}"
      return 0
    fi
    if [[ ${attempt} -lt ${RETRY_ATTEMPTS} ]]; then
      sleep "${RETRY_DELAY_SECONDS}"
    fi
    attempt=$((attempt + 1))
  done

  printf '%s' "${body}"
  return 0
}

if [[ -z "${MANAGER_TOKEN}" ]]; then
  rooms_code=$(request_status "${BASE_URL}/api/oa/chat/rooms/") || exit 1
  echo "GET /api/oa/chat/rooms/ (unauthenticated) -> ${rooms_code}"
  if [[ "${rooms_code}" != "401" ]]; then
    echo "Expected 401 for unauthenticated OA room list."
    exit 1
  fi

  files_code=$(request_status "${BASE_URL}/api/oa/files/") || exit 1
  echo "GET /api/oa/files/ (unauthenticated) -> ${files_code}"
  if [[ "${files_code}" != "401" ]]; then
    echo "Expected 401 for unauthenticated OA file list."
    exit 1
  fi

  echo "OA smoke passed (auth gate checks only)."
  exit 0
fi

auth_header="Authorization: Bearer ${MANAGER_TOKEN}"
actor_id_header="x-employee-id: ${ACTOR_ID}"
actor_name_header="x-actor-name: ${ACTOR_NAME_ENCODED}"
actor_role_header="x-user-role: ${ACTOR_ROLE}"
common_headers=(
  -H "${auth_header}"
  -H "${actor_id_header}"
  -H "${actor_name_header}"
  -H "${actor_role_header}"
)

rooms_code=$(request_status "${BASE_URL}/api/oa/chat/rooms/" "${common_headers[@]}") || exit 1
echo "GET /api/oa/chat/rooms/ -> ${rooms_code}"
if [[ "${rooms_code}" != "200" ]]; then
  echo "OA room list failed."
  exit 1
fi

orgs_code=$(request_status "${BASE_URL}/api/oa/org/" "${common_headers[@]}") || exit 1
echo "GET /api/oa/org/ -> ${orgs_code}"
if [[ "${orgs_code}" != "200" ]]; then
  echo "OA org list failed."
  exit 1
fi

contacts_code=$(request_status "${BASE_URL}/api/oa/contacts/" "${common_headers[@]}") || exit 1
echo "GET /api/oa/contacts/ -> ${contacts_code}"
if [[ "${contacts_code}" != "200" ]]; then
  echo "OA contacts list failed."
  exit 1
fi

sync_code=$(request_status \
  "${BASE_URL}/api/oa/contacts/sync/" \
  -X POST \
  "${common_headers[@]}" \
  -H 'content-type: application/json' \
  --data '{"onlyActive":false,"limit":120}') || exit 1
echo "POST /api/oa/contacts/sync/ -> ${sync_code}"
if [[ "${sync_code}" == "412" ]]; then
  echo "OA contacts sync skipped: Gaia API config missing in strict live mode."
elif [[ "${sync_code}" != "200" ]]; then
  echo "OA contacts sync failed."
  exit 1
fi

create_payload='{"name":"OA Smoke Room","type":"group","members":["Marlins","local-admin"]}'
if ! create_raw=$(curl -sS -i \
  -X POST \
  "${common_headers[@]}" \
  -H 'content-type: application/json' \
  --data "${create_payload}" \
  "${BASE_URL}/api/oa/chat/rooms/"); then
  echo "Request failed: ${BASE_URL}/api/oa/chat/rooms/ (create)"
  exit 1
fi
create_status=$(printf '%s' "${create_raw}" | awk 'NR==1 {print $2}')
echo "POST /api/oa/chat/rooms/ -> ${create_status}"
room_id=$(printf '%s' "${create_raw}" | rg -o '"id":"room-[^"]+"' | head -n 1 | sed 's/"id":"//;s/"$//')
if [[ "${create_status}" != "201" || -z "${room_id}" ]]; then
  room_id="room-hq-announcement"
  echo "OA room create unavailable in current environment, fallback room_id=${room_id}"
else
  echo "room_id=${room_id}"
fi

org_create_payload='{"name":"OA Smoke Org","parentId":"org-hq","managerEmployeeId":"Marlins"}'
if ! org_create_raw=$(curl -sS -i \
  -X POST \
  "${common_headers[@]}" \
  -H 'content-type: application/json' \
  --data "${org_create_payload}" \
  "${BASE_URL}/api/oa/org/"); then
  echo "Request failed: ${BASE_URL}/api/oa/org/ (create)"
  exit 1
fi
org_create_status=$(printf '%s' "${org_create_raw}" | awk 'NR==1 {print $2}')
echo "POST /api/oa/org/ -> ${org_create_status}"
if [[ "${org_create_status}" != "201" ]]; then
  echo "OA org create failed."
  exit 1
fi

org_id=$(printf '%s' "${org_create_raw}" | rg -o '"id":"org-[^"]+"' | head -n 1 | sed 's/"id":"//;s/"$//')
if [[ -z "${org_id}" ]]; then
  echo "Cannot parse created OA org id."
  exit 1
fi
echo "org_id=${org_id}"

contact_employee_id="smoke$(date '+%H%M%S')"
contact_create_payload=$(printf '{"employeeId":"%s","name":"OA Smoke Contact","title":"Test","orgUnitId":"%s","mobile":"13800009999","email":"smoke-contact@starkitchen.ai","status":"active"}' "${contact_employee_id}" "${org_id}")
contact_create_code=$(request_status \
  "${BASE_URL}/api/oa/contacts/" \
  -X POST \
  "${common_headers[@]}" \
  -H 'content-type: application/json' \
  --data "${contact_create_payload}") || exit 1
echo "POST /api/oa/contacts/ -> ${contact_create_code}"
if [[ "${contact_create_code}" != "201" ]]; then
  echo "OA contact create failed."
  exit 1
fi

contact_search_code=$(request_status \
  "${BASE_URL}/api/oa/contacts/?search=${contact_employee_id}" \
  "${common_headers[@]}") || exit 1
echo "GET /api/oa/contacts/?search=${contact_employee_id} -> ${contact_search_code}"
if [[ "${contact_search_code}" != "200" ]]; then
  echo "OA contact search failed."
  exit 1
fi

send_payload=$(printf '{"roomId":"%s","content":"OA smoke message","attachments":[]}' "${room_id}")
send_code=$(request_status_with_retry "201" \
  "${BASE_URL}/api/oa/chat/messages/" \
  -X POST \
  "${common_headers[@]}" \
  -H 'content-type: application/json' \
  --data "${send_payload}") || exit 1
echo "POST /api/oa/chat/messages/ -> ${send_code}"
if [[ "${send_code}" != "201" ]]; then
  if [[ "${room_id}" != "room-hq-announcement" ]]; then
    room_id="room-hq-announcement"
    echo "OA message send fallback to room_id=${room_id}"
    send_payload=$(printf '{"roomId":"%s","content":"OA smoke message","attachments":[]}' "${room_id}")
    send_code=$(request_status_with_retry "201" \
      "${BASE_URL}/api/oa/chat/messages/" \
      -X POST \
      "${common_headers[@]}" \
      -H 'content-type: application/json' \
      --data "${send_payload}") || exit 1
    echo "POST /api/oa/chat/messages/ (fallback) -> ${send_code}"
  fi
  if [[ "${send_code}" != "201" ]]; then
    echo "OA message send failed."
    exit 1
  fi
fi

upload_file="${TMP_DIR}/oa-upload-smoke.txt"
printf 'oa smoke attachment %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" > "${upload_file}"

if ! upload_raw=$(curl -sS -i \
  -X POST \
  "${common_headers[@]}" \
  -F "roomId=${room_id}" \
  -F "file=@${upload_file};type=text/plain" \
  "${BASE_URL}/api/oa/files/"); then
  echo "Request failed: ${BASE_URL}/api/oa/files/ (upload)"
  exit 1
fi
upload_status=$(printf '%s' "${upload_raw}" | awk 'NR==1 {print $2}')
echo "POST /api/oa/files/ -> ${upload_status}"
if [[ "${upload_status}" != "201" ]]; then
  echo "OA file upload failed."
  exit 1
fi

file_id=$(printf '%s' "${upload_raw}" | rg -o '"id":"file-[^"]+"' | head -n 1 | sed 's/"id":"//;s/"$//')
if [[ -z "${file_id}" ]]; then
  echo "Cannot parse uploaded file id."
  exit 1
fi
echo "file_id=${file_id}"

messages_url="${BASE_URL}/api/oa/chat/messages/?roomId=${room_id}&limit=20"
messages_code=$(request_status_with_retry "200" "${messages_url}" "${common_headers[@]}") || exit 1
echo "GET /api/oa/chat/messages/?roomId=${room_id} -> ${messages_code}"
if [[ "${messages_code}" != "200" ]]; then
  echo "OA message read failed."
  exit 1
fi

if ! messages_raw=$(request_body_with_retry "${messages_url}" '"senderName":"' "${common_headers[@]}"); then
  echo "Request failed: ${messages_url} (body)"
  exit 1
fi
if ! printf '%s' "${messages_raw}" | rg -q '"senderName":"'; then
  echo "OA sender name missing in message payload."
  exit 1
fi
if printf '%s' "${messages_raw}" | rg -q '%E6%9E%97%E6%80%BB'; then
  echo "OA sender name decode failed."
  exit 1
fi
echo "senderName decode -> ok (林总)"

files_code=$(request_status "${BASE_URL}/api/oa/files/?roomId=${room_id}" "${common_headers[@]}") || exit 1
echo "GET /api/oa/files/?roomId=${room_id} -> ${files_code}"
if [[ "${files_code}" != "200" ]]; then
  echo "OA file list failed."
  exit 1
fi

download_code=$(request_status_with_retry "200" "${BASE_URL}/api/oa/files/${file_id}/" "${common_headers[@]}") || exit 1
echo "GET /api/oa/files/${file_id}/ -> ${download_code}"
if [[ "${download_code}" != "200" ]]; then
  echo "OA file download failed."
  exit 1
fi

call_payload=$(printf '{"mode":"video","title":"OA Smoke Video Call","roomId":"%s","participants":["Marlins","local-admin"]}' "${room_id}")
call_code=$(request_status \
  "${BASE_URL}/api/oa/calls/" \
  -X POST \
  "${common_headers[@]}" \
  -H 'content-type: application/json' \
  --data "${call_payload}") || exit 1
echo "POST /api/oa/calls/ -> ${call_code}"
if [[ "${call_code}" != "201" ]]; then
  echo "OA call create failed."
  exit 1
fi

calls_code=$(request_status "${BASE_URL}/api/oa/calls/" "${common_headers[@]}") || exit 1
echo "GET /api/oa/calls/ -> ${calls_code}"
if [[ "${calls_code}" != "200" ]]; then
  echo "OA call list failed."
  exit 1
fi

meeting_payload=$(printf '{"title":"OA Smoke Meeting","agenda":"integration test","roomId":"%s","startsAt":"2030-01-01T09:00:00.000Z","durationMinutes":45,"participants":["Marlins","local-admin"]}' "${room_id}")
meeting_code=$(request_status \
  "${BASE_URL}/api/oa/meetings/" \
  -X POST \
  "${common_headers[@]}" \
  -H 'content-type: application/json' \
  --data "${meeting_payload}") || exit 1
echo "POST /api/oa/meetings/ -> ${meeting_code}"
if [[ "${meeting_code}" != "201" ]]; then
  echo "OA meeting create failed."
  exit 1
fi

meetings_code=$(request_status "${BASE_URL}/api/oa/meetings/" "${common_headers[@]}") || exit 1
echo "GET /api/oa/meetings/ -> ${meetings_code}"
if [[ "${meetings_code}" != "200" ]]; then
  echo "OA meeting list failed."
  exit 1
fi

audit_code=$(request_status "${BASE_URL}/api/oa/audit/?page=1&size=20" "${common_headers[@]}") || exit 1
echo "GET /api/oa/audit/?page=1&size=20 -> ${audit_code}"
if [[ "${audit_code}" != "200" ]]; then
  echo "OA audit list failed."
  exit 1
fi

contact_delete_code=$(request_status \
  "${BASE_URL}/api/oa/contacts/?employeeId=${contact_employee_id}" \
  -X DELETE \
  "${common_headers[@]}") || exit 1
echo "DELETE /api/oa/contacts/?employeeId=${contact_employee_id} -> ${contact_delete_code}"
if [[ "${contact_delete_code}" != "200" ]]; then
  echo "OA contact delete failed."
  exit 1
fi

org_delete_code=$(request_status \
  "${BASE_URL}/api/oa/org/?orgUnitId=${org_id}" \
  -X DELETE \
  "${common_headers[@]}") || exit 1
echo "DELETE /api/oa/org/?orgUnitId=${org_id} -> ${org_delete_code}"
if [[ "${org_delete_code}" != "200" ]]; then
  echo "OA org delete failed."
  exit 1
fi

echo "OA smoke test passed."
