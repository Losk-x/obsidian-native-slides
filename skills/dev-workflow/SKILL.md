---
name: dev-workflow
description: Mandatory development workflow for this repository — isolated branch/worktree, merge latest main before PR, CLI-first, human review required, cleanup after merge.
---

# Development Workflow (Rule 1)

This skill is the full specification of **Rule 1** in [AGENTS.md](../../AGENTS.md). Every change to this repository MUST follow it. **Never commit directly to `main`.**

## Principles

- **CLI tools first.** Every step is driven by CLI tools (`git`, `gh`, `npm`). After the CLI creates a worktree, enter it with the agent's own harness command for entering a worktree (a human just `cd`s into it). Never operate on the main checkout from a worktree context and vice versa.
- **No rebase.** Always `merge` the latest `main` into the branch and resolve conflicts explicitly. Never rewrite history with `rebase`.
- **Human review required.** A PR is merged only after a human reviews/approves it. The agent MUST NOT merge its own PR and MUST NOT bypass the review process.

## Workflow

### 1. Create / enter an isolated branch or worktree

```sh
# Option A: branch in the current checkout
git switch -c feat/my-change

# Option B: dedicated worktree (keeps the main checkout clean)
git worktree add ../obsidian-wt-my-change -b feat/my-change
# then enter the worktree:
#   agent  → use your harness command to enter the created worktree
#   human  → cd ../obsidian-wt-my-change
```

### 2. Before opening a PR: merge the latest main

```sh
git fetch origin
git merge origin/main
```

- Resolve any merge conflicts, then verify locally.
- **Rebuild and test locally** before submitting (run from the repository root):

  ```sh
  npm ci               # first time only
  npm run check        # TypeScript type-check (tsc --noEmit)
  npm run test         # vitest unit tests
  npm run lint         # ESLint
  npm run format:check # Prettier
  npm run build        # compile main.ts → main.js
  ```

- Never open a PR that is behind or in conflict with `origin/main`.

### 3. Commit, push, open a PR

```sh
git add -A
git commit -m "type: short summary"   # conventional commits
git push -u origin feat/my-change
gh pr create --base main --head feat/my-change --title "..." --body "..."
```

### 4. Wait for human review

A PR is merged only after a human reviews/approves it. The agent MUST NOT merge its own PR and MUST NOT bypass the review process. When addressing review comments:

1. Apply the requested changes.
2. If `main` moved: `git fetch origin && git merge origin/main`, resolve conflicts.
3. Rebuild and test locally (see step 2).
4. Re-push and reply to the comments.

### 5. After the PR is merged: clean up and sync

```sh
git checkout main
git pull origin main                          # sync to the latest main
git branch -d feat/my-change                  # delete the local branch
git worktree remove ../obsidian-wt-my-change  # remove the worktree, if used
```
