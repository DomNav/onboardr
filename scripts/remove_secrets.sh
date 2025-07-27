#!/bin/bash

# ===================================================================
# Onboardr Security Cleanup Script
# ===================================================================
# This script removes leaked secrets from git history using git filter-repo.
# It specifically targets the ANTHROPIC_API_KEY leak in commit d8eca0b.
#
# WARNING: This script will rewrite git history. All contributors must
# re-clone the repository after this script is run and force-pushed.
#
# Prerequisites:
# - git filter-repo installed: pip install git-filter-repo
# - All team members must be notified before running
# - Create backup of repository before running
#
# Usage: ./scripts/remove_secrets.sh
# ===================================================================

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }

# Function to check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Not in a git repository!"
        exit 1
    fi
    
    # Check if git filter-repo is installed
    if ! command -v git-filter-repo > /dev/null 2>&1; then
        log_error "git-filter-repo is not installed!"
        log_info "Install it with: pip install git-filter-repo"
        exit 1
    fi
    
    # Check if working directory is clean
    if [[ -n "$(git status --porcelain)" ]]; then
        log_error "Working directory is not clean! Commit or stash changes first."
        git status --short
        exit 1
    fi
    
    log_success "Prerequisites check passed!"
}

# Function to create backup
create_backup() {
    local backup_branch="secrets-backup-$(date +%Y%m%d-%H%M%S)"
    log_info "Creating backup branch: $backup_branch"
    
    git checkout -b "$backup_branch"
    git checkout master  # or main branch
    
    log_success "Backup created: $backup_branch"
    echo "To restore from backup later: git checkout $backup_branch"
}

# Function to identify secrets in history
identify_secrets() {
    log_info "Identifying secrets in git history..."
    
    # List of secrets we identified during audit
    local leaked_secrets=(
        "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"
        "asdfasdfasdfas"  # Dummy DUNE_API_KEY
        "fasdfsdfsa"      # Dummy SOROSWAP_TVL_QUERY_ID
    )
    
    # Check which commits contain these secrets
    log_info "Checking for leaked secrets in history..."
    for secret in "${leaked_secrets[@]}"; do
        local commits=$(git log --all --oneline -S "$secret" || true)
        if [[ -n "$commits" ]]; then
            log_warn "Found secret '$secret' in commits:"
            echo "$commits"
        fi
    done
}

# Function to remove the problematic file from history
remove_file_from_history() {
    log_info "Removing .env.local from git history..."
    
    # Use git filter-repo to remove .env.local from all commits
    cd "$REPO_ROOT"
    git filter-repo --invert-paths --path .env.local --force
    
    log_success ".env.local removed from git history"
}

# Function to remove specific secret strings from history
remove_secret_strings() {
    log_info "Removing secret strings from git history..."
    
    # Create temporary file with replacement expressions
    local replacement_file="$(mktemp)"
    
    # Add replacements for the leaked secrets
    cat > "$replacement_file" << 'EOF'
# Replace ANTHROPIC_API_KEY value with placeholder
regex:ANTHROPIC_API_KEY=sk-ant-api03-[a-zA-Z0-9_-]+==>\nANTHROPIC_API_KEY=your-anthropic-api-key-here
regex:DUNE_API_KEY=asdfasdfasdfas==>\nDUNE_API_KEY=your-dune-api-key-here
regex:SOROSWAP_TVL_QUERY_ID=fasdfsdfsa==>\nSOROSWAP_TVL_QUERY_ID=your-query-id-here
EOF
    
    # Apply the replacements
    cd "$REPO_ROOT"
    git filter-repo --replace-text "$replacement_file" --force
    
    # Clean up
    rm -f "$replacement_file"
    
    log_success "Secret strings sanitized in git history"
}

# Function to verify cleanup
verify_cleanup() {
    log_info "Verifying cleanup..."
    
    # Check for the specific leaked ANTHROPIC_API_KEY
    if git log --all --source -S "sk-ant-api03" --oneline 2>/dev/null | grep -q .; then
        log_error "ANTHROPIC_API_KEY still found in history!"
        return 1
    fi
    
    # Check if .env.local exists in any commit
    if git log --all --name-only -- .env.local 2>/dev/null | grep -q "\.env\.local"; then
        log_error ".env.local still found in history!"
        return 1
    fi
    
    log_success "Cleanup verification passed!"
}

# Function to show next steps
show_next_steps() {
    log_info "Git history cleanup completed successfully!"
    echo
    log_warn "IMPORTANT NEXT STEPS:"
    echo "1. Review the cleaned history: git log --oneline"
    echo "2. Force push to remote (this will rewrite history for all users):"
    echo "   git push --force --prune origin --all"
    echo "   git push --force --prune origin --tags"
    echo
    echo "3. Notify all team members that they must:"
    echo "   - Delete their local clones"
    echo "   - Re-clone the repository"
    echo "   - NOT attempt to merge old branches"
    echo
    echo "4. Rotate the exposed credentials:"
    echo "   - Generate new ANTHROPIC_API_KEY in Anthropic Console"
    echo "   - Update environment variables in deployment systems"
    echo "   - Update CI/CD secrets in GitHub Actions"
    echo
    echo "5. Complete the security hardening:"
    echo "   - Set up pre-commit hooks"
    echo "   - Configure secret scanning in CI"
    echo "   - Update .gitignore"
    echo
    log_success "Repository is ready for force push!"
}

# Main execution
main() {
    echo "=================================="
    echo "  Onboardr Security Cleanup"
    echo "=================================="
    echo
    
    check_prerequisites
    create_backup
    identify_secrets
    
    # Confirm before proceeding
    echo
    log_warn "This will permanently rewrite git history!"
    read -p "Are you sure you want to proceed? (type 'yes' to continue): " confirm
    if [[ "$confirm" != "yes" ]]; then
        log_info "Operation cancelled."
        exit 0
    fi
    
    remove_file_from_history
    remove_secret_strings
    verify_cleanup
    show_next_steps
}

# Run the script
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi