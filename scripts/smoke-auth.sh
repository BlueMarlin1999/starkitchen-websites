#!/usr/bin/env bash

request_login_token() {
  local base_url="$1"
  local username="$2"
  local password="$3"

  if [[ -z "${base_url}" || -z "${username}" || -z "${password}" ]]; then
    return 1
  fi

  local payload
  payload=$(printf '{"employeeId":"%s","password":"%s"}' "${username}" "${password}")

  local raw
  if ! raw=$(curl -sS -i -L --max-time 20 \
    -X POST \
    -H 'content-type: application/json' \
    --data "${payload}" \
    "${base_url}/api/auth/login"); then
    return 1
  fi

  local http_status
  http_status=$(printf '%s' "${raw}" | awk '/^HTTP/{code=$2} END{print code}')
  if [[ "${http_status}" != "200" ]]; then
    return 1
  fi

  local token
  token=$(
    printf '%s' "${raw}" |
      rg -o '"(token|accessToken|access_token)":"[^"]+"' |
      head -n 1 |
      sed -E 's/"(token|accessToken|access_token)":"//;s/"$//'
  )
  if [[ -z "${token}" ]]; then
    return 1
  fi

  printf '%s' "${token}"
}
