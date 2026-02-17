#!/bin/sh
# Commit as LegacyLink AI (author and committer).
export GIT_AUTHOR_NAME="LegacyLink AI"
export GIT_AUTHOR_EMAIL="legacylink-ai@example.com"
export GIT_COMMITTER_NAME="LegacyLink AI"
export GIT_COMMITTER_EMAIL="legacylink-ai@example.com"
exec git commit "$@"
