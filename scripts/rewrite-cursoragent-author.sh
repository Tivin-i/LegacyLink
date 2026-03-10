#!/bin/sh
# Rewrite history so any commit with author "cursoragent" or "Cursor Agent" is
# attributed to "LegacyLink AI <legacylink-ai@example.com>". Run from repo root.
# If that contributor still appears on GitHub: run this script, then
#   git push --force-with-lease origin main
# (and any other branches you rewrote). Requires a force-push.
set -e
cd "$(git rev-parse --show-toplevel)"

export FILTER_BRANCH_SQUELCH_WARNING=1
canonical_name="LegacyLink AI"
canonical_email="legacylink-ai@example.com"

# Rewrite author and committer for cursoragent / Cursor Agent
git filter-branch -f --env-filter '
  case "$GIT_AUTHOR_NAME" in
    cursoragent|"Cursor Agent") export GIT_AUTHOR_NAME="'"$canonical_name"'"; export GIT_AUTHOR_EMAIL="'"$canonical_email"'"; ;;
  esac
  case "$GIT_COMMITTER_NAME" in
    cursoragent|"Cursor Agent") export GIT_COMMITTER_NAME="'"$canonical_name"'"; export GIT_COMMITTER_EMAIL="'"$canonical_email"'"; ;;
  esac
' -- --all

echo "Done. Review with: git log --all --format='%an <%ae>' | sort -u"
echo "Then force-push: git push --force-with-lease origin main"
