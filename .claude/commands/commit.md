---
name: commit
description: Commit and push changes to GitHub with smart message generation
confirmation: true
allowed-tools:
  - Bash
  - Read
  - Grep
argument-hint: (optional) custom commit message
---

# /commit - Smart Git Commit & Push

Analyzes your changes, generates a descriptive commit message following conventional commit standards with emojis, commits the changes, and pushes to GitHub.

## Usage

```bash
/commit                    # Auto-generate commit message
/commit "custom message"   # Use custom message
```

## What it does

1. **📊 Analyzes Changes**
   - Checks git status and diffs
   - Reviews recent commit patterns
   - Identifies change types (feat, fix, chore, etc.)

2. **✍️ Generates Message**
   - Creates conventional commit with emoji
   - Follows project commit style
   - Includes Claude Code attribution
   - Uses proper heredoc format

3. **💾 Commits & Pushes**
   - Stages all changes
   - Creates commit with generated message
   - Pushes to current branch
   - Handles pre-commit hooks

4. **🛡️ Safety First**
   - Never skips hooks
   - Never force pushes to main/master
   - Checks for sensitive files
   - Verifies authorship before amending

## Implementation

The command will execute these steps:

### 1. Verify Git Configuration
Use multiple Bash tool calls in a single message to run these commands in parallel:
- `git config user.name` - Verify user name is set
- `git config user.email` - Verify user email is set
- If either is missing, exit with error message to configure git

### 2. Check for Changes & Merge Conflicts
Use multiple Bash tool calls in a single message to run these commands in parallel:
- `git status --porcelain` - Check if there are any changes
- `git diff --check` - Check for merge conflict markers
- If working directory is clean, exit with message "No changes to commit"
- If merge conflicts detected, exit with message "Resolve merge conflicts before committing"

### 3. Collect Git Information (in parallel)
Use multiple Bash tool calls in a single message to run these commands in parallel:
- `git status` - Get detailed status
- `git diff --staged --name-status` - Get staged changes
- `git diff --name-status` - Get unstaged changes
- `git log -5 --oneline --no-decorate` - Get recent commits for style reference
- `git branch --show-current` - Get current branch name
- `git remote -v` - Verify remote exists

### 4. Check for Sensitive Files
- Scan changed files for sensitive patterns: `.env`, `credentials`, `secrets`, `key`, `.pem`
- If sensitive files detected:
  - Display warning with list of files
  - Ask user to confirm before proceeding
  - Exit if user declines

### 5. Stage All Changes
- Run `git add .` to stage all changes
- Confirm staging was successful

### 6. Generate Commit Message
**If custom message provided via $ARGUMENTS:**
- Use the custom message
- Add Claude Code attribution footer

**If no custom message (auto-generate):**
- Analyze `git diff --staged --name-status` output
- Determine change type:
  - `feat` (✨) if new files added (status `A`) in components/app
  - `fix` (🐛) if existing files modified in components/app
  - `test` (✅) if test/spec files changed
  - `docs` (📝) if only docs/ files changed
  - `chore` (🔧) as default
- Detect scope from file paths:
  - `components` if components/ modified
  - `app` if app/ modified
  - `lib` if lib/ modified
  - `scripts` if scripts/ modified
- Analyze diff content for description:
  - "add new functionality" if `+function`, `+const`, or `+export` found
  - "remove unused files" if `delete mode` found
  - "refactor and reorganize code" if `rename` found
  - "update project files" as default
- Format: `<emoji> <type>(scope): <description>`

**Final message format:**
```
<emoji> <type>(scope): <description>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 7. Create Commit
- Display the commit message for review
- Run commit using heredoc format:
```bash
git commit -m "$(cat <<'EOF'
<generated commit message>
EOF
)"
```
- Get commit hash with `git rev-parse --short HEAD`
- Display success message with commit hash

**Handle pre-commit hook failures:**
- If commit fails with "pre-commit" error:
  - Check authorship: `git log -1 --format='%an %ae'`
  - Check branch status: `git status`
  - If author is "Claude" and branch is ahead (not pushed):
    - Stage hook changes: `git add .`
    - Amend commit: `git commit --amend --no-edit`
  - Otherwise:
    - Create new commit for hook fixes: `git commit -m "chore: apply pre-commit hook fixes"`

### 8. Sync with Remote Before Push
- Check if remote tracking branch exists: `git rev-parse --abbrev-ref @{upstream}`
- If upstream exists:
  - Check for divergence: `git rev-list --left-right --count HEAD...@{upstream}`
  - If remote has new commits:
    - Display message: "Remote branch has new commits, pulling with rebase..."
    - Run `git pull --rebase origin <branch>`
    - If rebase fails, exit with error to resolve manually
- If no upstream, skip pull (will set upstream during push)

### 9. Push to Remote
- Verify remote exists (from step 3)
- If no remote, exit with error to add remote first
- Check if current branch is `main` or `master`
  - If yes, warn user they're pushing to main branch
  - Never use --force on main/master branches
- Try `git push origin <branch>`
- Handle push errors:
  - If "no upstream": run `git push -u origin <branch>` to set upstream
  - If "rejected":
    - If due to non-fast-forward, exit with error (this shouldn't happen after pull --rebase)
    - Suggest `git pull --rebase` and try again
  - If "hook declined": display hook error message
  - Other errors: display error message and exit

### 10. Display Final Status
- Run `git status` to show final state
- Display success message: "Successfully committed and pushed changes to GitHub!"

## Commit Message Format

The command generates messages in this format:

```
<emoji> <type>(scope): <description>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Emoji Mapping

| Type | Emoji | Description |
|------|-------|-------------|
| feat | ✨ | New feature |
| fix | 🐛 | Bug fix |
| docs | 📝 | Documentation |
| style | 💄 | Styling changes |
| refactor | ♻️ | Code refactoring |
| perf | ⚡ | Performance improvement |
| test | ✅ | Tests |
| chore | 🔧 | Maintenance |
| ci | 👷 | CI/CD changes |
| build | 🏗️ | Build system |

## Safety Features

- ✅ Verifies git user configuration before committing
- ✅ Checks for merge conflict markers
- ✅ Checks for sensitive files (.env, credentials)
- ✅ Never skips pre-commit hooks
- ✅ Never force pushes to main/master
- ✅ Pulls with rebase before pushing to avoid conflicts
- ✅ Handles pre-commit hook modifications safely
- ✅ Verifies authorship before amending
- ✅ Verifies remote exists before pushing
- ✅ Uses heredoc format for proper message formatting
- ✅ Provides clear error messages
- ✅ Warns when pushing directly to main/master

## Examples

### Auto-generated message
```bash
/commit
# Analyzes changes and creates:
# ✨ feat(components): add subscriber welcome banner
```

### Custom message
```bash
/commit "fix: resolve authentication timeout issue"
# Uses your custom message with Claude attribution
```

## Troubleshooting

### Git user not configured
- Set your name: `git config --global user.name "Your Name"`
- Set your email: `git config --global user.email "your.email@example.com"`

### No changes to commit
- Check if you have unstaged changes: `git status`
- Stage your changes: `git add .`

### Merge conflicts detected
- Review conflicts: `git status`
- Resolve conflicts in affected files
- Stage resolved files: `git add <file>`
- Run `/commit` again

### Pre-commit hook failures
- The command automatically handles hook changes
- Amends commit if safe, or creates new commit

### Push rejected after rebase
- This shouldn't happen as we rebase before pushing
- If it does, verify remote state: `git fetch && git status`
- Resolve any issues manually

### Rebase conflicts
- The command will exit if rebase fails
- Resolve conflicts manually: `git status`
- Continue rebase: `git rebase --continue`
- Or abort: `git rebase --abort`
- Run `/commit` again after resolving

### No remote configured
- Add remote: `git remote add origin <repository-url>`
- Run `/commit` again

### Sensitive files warning
- Review the flagged files
- Add to .gitignore if they shouldn't be committed
- Confirm to proceed if files are safe

## Notes

- Always stages all changes before committing
- Follows conventional commit standards
- Includes Claude Code attribution
- Respects git hooks and safety protocols
- Works with current branch (no branch switching)
