#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT_PATH="${SCRIPT_DIR}/setup-seo-wizard.sh"
TEST_DIR="$(mktemp -d)"
trap 'rm -rf "$TEST_DIR"' EXIT

ENV_FILE="${TEST_DIR}/.env"
SEO_SETUP_WIZARD_SOURCE_ONLY=1
source "$SCRIPT_PATH"

printf 'KEEP_ME=yes\nVITE_GSC_TOKEN=old\nVITE_GSC_TOKEN=duplicate\n' > "$ENV_FILE"
GSC_TOKEN='new|token&with/slashes\and spaces'
write_env VITE_GSC_TOKEN "$GSC_TOKEN"
write_env VITE_BING_TOKEN 'bing&token|safe/value'

[[ "$(grep -Fxc "VITE_GSC_TOKEN=${GSC_TOKEN}" "$ENV_FILE")" -eq 1 ]]
[[ "$(grep -Fxc 'VITE_BING_TOKEN=bing&token|safe/value' "$ENV_FILE")" -eq 1 ]]
grep -Fxq 'KEEP_ME=yes' "$ENV_FILE"
[[ "$(grep -c '^VITE_GSC_TOKEN=' "$ENV_FILE")" -eq 1 ]]

if write_env VITE_GSC_TOKEN $'injected\nSECOND_KEY=bad'; then
  printf '%s\n' 'write_env accepted a multi-line token' >&2
  exit 1
fi
[[ "$(grep -Fxc "VITE_GSC_TOKEN=${GSC_TOKEN}" "$ENV_FILE")" -eq 1 ]]

printf '%s\n' 'setup-seo-wizard write_env checks passed'
