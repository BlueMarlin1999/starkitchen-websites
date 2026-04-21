#!/usr/bin/env bash
set -euo pipefail

PROJECT_CWD="${1:-$(pwd)}"

ask_secret() {
  local prompt="$1"
  local value=''
  while [[ -z "${value}" ]]; do
    read -r -s -p "${prompt}" value
    printf '\n'
  done
  printf '%s' "${value}"
}

set_vercel_env() {
  local key="$1"
  local target_env="$2"
  local value="$3"

  npx vercel env rm "${key}" "${target_env}" --yes --cwd "${PROJECT_CWD}" >/dev/null 2>&1 || true
  printf '%s\n' "${value}" | npx vercel env add "${key}" "${target_env}" --cwd "${PROJECT_CWD}" >/dev/null
  printf 'Set %s for %s\n' "${key}" "${target_env}"
}

echo 'Paste Neon pooled connection string (for DATABASE_URL).'
POOLED_URL="$(ask_secret 'Pooled URL: ')"

echo 'Paste Neon direct connection string (for DATABASE_URL_UNPOOLED).'
UNPOOLED_URL="$(ask_secret 'Direct URL: ')"

for env in production preview development; do
  set_vercel_env 'DATABASE_URL' "${env}" "${POOLED_URL}"
  set_vercel_env 'DATABASE_URL_UNPOOLED' "${env}" "${UNPOOLED_URL}"
done

echo 'Neon database environment variables have been configured in Vercel.'
