#!/usr/bin/env bash
# SEO setup wizard — FOCES website (foces.ceconline.edu)
# Walks a human through: Google Search Console verification (meta-tag method,
# writes VITE_GSC_TOKEN to .env), sitemap submission, Bing Webmaster import,
# and GitHub Dependabot security toggles.
#
# Prereqs already done by the repo (verified live):
#   /sitemap.xml, /robots.txt, /googlec89b7ce852d492d3.html all 200.
set -euo pipefail

TOTAL_STAGES=5
STAGE=0
ENV_FILE="${ENV_FILE:-.env}"

say()  { printf '%s\n' "$*"; }
step() { printf '  %s\n' "$*"; }

open_url() {
  local url="$1"
  say "Opening: $url"
  case "${OSTYPE:-}" in
    msys*|cygwin*) start "" "$url" >/dev/null 2>&1 || explorer.exe "$url" >/dev/null 2>&1 || true ;;
    darwin*) open "$url" >/dev/null 2>&1 || true ;;
    linux-gnu*)
      if grep -qi microsoft /proc/version 2>/dev/null; then
        explorer.exe "$url" >/dev/null 2>&1 || cmd.exe /c start "$url" >/dev/null 2>&1 || true
      else
        xdg-open "$url" >/dev/null 2>&1 || true
      fi ;;
    *) say "(open manually: $url)" ;;
  esac
}

stage() {
  STAGE=$((STAGE + 1))
  printf '\n===== [%d/%d] %s =====\n' "$STAGE" "$TOTAL_STAGES" "$1"
}

# Idempotent .env upsert: KEY=value.
write_env() {
  local key="$1" value="$2"
  local tmp line replaced=0

  if [[ "$value" == *$'\n'* || "$value" == *$'\r'* ]]; then
    step "value for ${key} must fit on one line"
    return 1
  fi

  tmp=$(mktemp "${ENV_FILE}.tmp.XXXXXX") || return 1
  if [[ -f "$ENV_FILE" ]]; then
    while IFS= read -r line || [[ -n "$line" ]]; do
      if [[ "$line" == "$key="* ]]; then
        if [[ "$replaced" == 0 ]]; then
          printf '%s=%s\n' "$key" "$value" >> "$tmp"
          replaced=1
        fi
      else
        printf '%s\n' "$line" >> "$tmp"
      fi
    done < "$ENV_FILE"
  fi
  if [[ "$replaced" == 0 ]]; then
    printf '%s=%s\n' "$key" "$value" >> "$tmp"
  fi

  if [[ -f "$ENV_FILE" ]]; then
    chmod --reference="$ENV_FILE" "$tmp" 2>/dev/null || chmod 600 "$tmp"
  else
    chmod 600 "$tmp"
  fi
  if ! mv -f "$tmp" "$ENV_FILE"; then
    rm -f "$tmp"
    return 1
  fi
  step "wrote ${key} to ${ENV_FILE}"
}

pause() {
  read -r -p "Press Enter when done..." _
}

confirm() {
  read -r -p "$1 [y/N] " ans
  [[ "$ans" == "y" || "$ans" == "Y" ]]
}

ask() {
  read -r -p "$1: " val
  printf '%s' "$val"
}

# Let the shell regression check source `write_env` without launching the
# interactive wizard or opening any external pages.
if [[ "${SEO_SETUP_WIZARD_SOURCE_ONLY:-0}" == "1" ]]; then
  return 0 2>/dev/null || exit 0
fi

say "FOCES SEO setup — $TOTAL_STAGES stages. Values land in ${ENV_FILE} (gitignored)."
say "Prereq check: verification file + sitemap are already live (repo shipped them)."
pause

# ---- Stage 1: Google Search Console property -------------------------------
stage "Google Search Console — add property"
open_url "https://search.google.com/search-console"
step "1. Sign in with the club's Google account."
step "2. Click 'Add property' (top-left dropdown)."
step "3. Choose 'URL prefix' and enter: https://foces.ceconline.edu"
step "4. On the verification screen pick the 'HTML file' method — the file"
step "   (googlec89b7ce852d492d3.html) is ALREADY deployed at the site root."
step "   Just click 'Verify'. If you prefer the 'HTML tag' method instead,"
step "   copy the content=\"...\" token — stage 2 takes it."
pause

# ---- Stage 2: optional meta-token fallback ---------------------------------
stage "Verification meta token (only if HTML-file verify failed)"
if confirm "Did the HTML-file verification FAIL and you switched to the HTML-tag method?"; then
  open_url "https://search.google.com/search-console" # keep context open
  TOKEN=$(ask "Paste the google-site-verification token (the quoted content value)")
  if [[ -n "$TOKEN" ]]; then
    write_env "VITE_GSC_TOKEN" "$TOKEN"
    step "Next: pnpm build + deploy (Vercel) injects <meta name=\"google-site-verification\">."
    step "Then return to Search Console and click Verify again."
  fi
else
  step "Skipped — HTML-file verification succeeded."
fi
pause

# ---- Stage 3: submit sitemap ------------------------------------------------
stage "Submit the sitemap"
open_url "https://search.google.com/search-console"
step "1. Select the foces.ceconline.edu property."
step "2. Left menu -> 'Sitemaps'."
step "3. In 'Add a new sitemap' enter exactly: sitemap.xml"
step "   (full URL: https://foces.ceconline.edu/sitemap.xml)"
step "4. Click SUBMIT. Status 'Success' may take minutes — 'Couldn't fetch'"
step "   right after submitting is normal, re-check in a day."
pause

# ---- Stage 4: Bing Webmaster -------------------------------------------------
stage "Bing Webmaster Tools"
open_url "https://www.bing.com/webmasters"
step "1. Sign in (Microsoft account)."
step "2. 'Import from Google Search Console' is the fast path — authorizes"
step "   GSC and imports the verified property + sitemap automatically."
step "3. Manual path instead: 'Add site manually' -> https://foces.ceconline.edu"
step "   -> verification via CNAME/DNS or meta tag. For the meta-tag method,"
step "   paste the msvalidate.01 token below and it ships as VITE_BING_TOKEN."
if confirm "Do you have a Bing meta verification token (msvalidate.01)?"; then
  BTOKEN=$(ask "Paste the msvalidate.01 token")
  if [[ -n "$BTOKEN" ]]; then
    write_env "VITE_BING_TOKEN" "$BTOKEN"
    step "Next: pnpm build + deploy injects <meta name=\"msvalidate.01\">."
  fi
fi
step "4. In Bing: Sitemaps -> submit https://foces.ceconline.edu/sitemap.xml"
pause

# ---- Stage 5: Dependabot security -------------------------------------------
stage "GitHub Dependabot security toggles"
open_url "https://github.com/Foces-core/Official_website_v3/settings/security_analysis"
step "1. Enable 'Dependabot alerts'."
step "2. Enable 'Dependabot security updates'."
step "   (Weekly CVE audit workflow pairs with these: audit detects,"
step "   Dependabot opens patch PRs, auto-merge lands them when green.)"
pause

say ""
say "DONE. Summary:"
say " - GSC: property verified, sitemap submitted"
say " - .env keys written: $(grep -c 'VITE_GSC_TOKEN\|VITE_BING_TOKEN' "$ENV_FILE" 2>/dev/null || echo 0)"
say "   -> run pnpm build + redeploy if any token was set"
say " - Bing: imported/added, sitemap submitted"
say " - Dependabot: alerts + security updates ON"
say "Next check (3-7 days): search 'site:foces.ceconline.edu' on Google/Bing."
