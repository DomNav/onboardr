## Pre-flight checklist (do once per machine)

| Step | Why | Command |
|------|-----|---------|
| **Install** `git-filter-repo` | It's a Python tool, not bundled with Git | `pip install git-filter-repo` |
| **Confirm clean working tree** | History rewrite aborts on unstaged work | `git status` → should say "nothing to commit" |
| **Fetch all remote refs** | Ensures you rewrite the latest state | `git fetch --all --prune` |
| **Verify backup strategy** | One extra belt-and-suspenders | `git branch with-secrets-backup` *(script does this too)* |