#!/usr/bin/env bash
#
# Purges all instances of the leaked secrets (ANTHROPIC_API_KEY, DUNE_API_KEY)
# from the entire git history, tags a backup branch, and force-pushes the
# cleaned tree back to origin.  ⚠️  READ THE WARNINGS BELOW BEFORE RUNNING!
# -------------------------------------------------------------------------

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

echo "⚠️  WARNING  ⚠️"
echo "This will REWRITE HISTORY and force-push. Make sure every teammate has"
echo "committed or stashed local work, then re-clones after this finishes."
read -rp "Type 'I understand' to continue: " CONFIRM
[[ $CONFIRM == "I understand" ]] || { echo "Aborted."; exit 1; }

# 1. Backup current state
git branch with-secrets-backup

# 2. Rewrite history using git-filter-repo
#    (replace the dummy patterns with more precise ones if needed)
git filter-repo \
    --replace-text <(cat <<'EOF'
ANTHROPIC_API_KEY=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==>ANTHROPIC_API_KEY=REDACTED_ANTHROPIC_API_KEY
DUNE_API_KEY=asdfasdfasdfas==>DUNE_API_KEY=REDACTED_DUNE_API_KEY
SOROSWAP_TVL_QUERY_ID=fasdfsdfsa==>SOROSWAP_TVL_QUERY_ID=REDACTED_QUERY_ID
EOF
) --force

# 3. Also remove the .env.local file entirely from history
git filter-repo --invert-paths --path .env.local --force

# 4. Verify cleanup
echo "🔍 Verifying cleanup..."
if git log --all --source -S "sk-ant-api03" --oneline 2>/dev/null | grep -q .; then
    echo "❌ ANTHROPIC_API_KEY still found in history!"
    exit 1
fi

if git log --all --name-only -- .env.local 2>/dev/null | grep -q "\.env\.local"; then
    echo "❌ .env.local still found in history!"
    exit 1
fi

echo "✅ Cleanup verification passed!"

# 5. Force push the cleaned history
echo "🚀 Force pushing cleaned history..."
git push --force --prune origin --all
git push --force --prune origin --tags

echo ""
echo "✅ SUCCESS! Git history has been cleaned and force-pushed."
echo ""
echo "📢 NEXT STEPS:"
echo "1. Notify all team members to delete their local clones and re-clone"
echo "2. Rotate the exposed ANTHROPIC_API_KEY in Anthropic Console"
echo "3. Update all environment variables in production/CI systems"
echo "4. Review SECURITY_CLEANUP.md for complete hardening steps"
echo ""
echo "🔒 The repository is now secure!"