---
name: dev-workflow
description: Mandatory development workflow for this repository — single checkout, one branch at a time, merge latest main before PR, CLI-first, human review required, reload-based preview loop, cleanup after merge.
---

# Development Workflow (Rule 1)

This skill is the full specification of **Rule 1** in [AGENTS.md](../../AGENTS.md). Every change to this repository MUST follow it. **Never commit directly to `main`.**

## Principles

- **CLI tools first.** Every step is driven by CLI tools (`git`, `gh`, `npm`).
- **Single checkout, one branch at a time.** All work happens in the one repository checkout; branches are created/switched with `git switch`. Features are developed **serially** — never parallel. No git worktrees.
- **No rebase.** Always `merge` the latest `main` into the branch and resolve conflicts explicitly. Never rewrite history with `rebase`.
- **Human review required.** A PR is merged only after a human reviews/approves it. The agent MUST NOT merge its own PR and MUST NOT bypass the review process.

## Preview loop (no restart, no hot-reload plugin)

The human opens **`example-vault/`** in Obsidian **once** and never needs to reopen it:

- After a **branch switch** or a **code change**, the human reloads with: `Cmd/Ctrl+P` → **Reload app without saving** (this reloads the whole vault in place — notes, config and plugins — per the official "Build a plugin" docs). The vault folder never changes, so Obsidian never needs "Open another vault".
- The agent announces "**ready to reload**" only after doing its part:
  1. **Clean Obsidian runtime noise** — Obsidian rewrites `example-vault/.obsidian/` configs (`core-plugins.json`, `community-plugins.json`, …) while running; revert those (`git checkout -- example-vault/.obsidian/`) so `git switch` is never blocked by a dirty tree.
  2. **Verify** — run `npm run check` / `npm run test` / `npm run lint` / `npm run format:check` / `npm run build` and confirm `main.js` is in sync (`git diff --exit-code -- main.js`).
- `npm run dev` (esbuild watch) is only needed while **actively editing** `main.ts`; viewing a branch's behavior needs nothing but the switch + reload (each branch carries its own committed, in-sync `main.js`).

## Workflow

### 1. Create / enter a branch (single checkout)

```sh
git switch -c feat/my-change
```

One feature at a time; the branch is based on the latest `main`.

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

**Docs check (before committing):** if the change is user-visible, update the affected documentation **in the same commit** — `README.md` / `README-zh.md` (both languages), `docs/*.md`, and `CHANGELOG.md` ([Unreleased] section). Never commit code without its docs.

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
git switch main
git pull origin main                          # sync to the latest main
git branch -d feat/my-change                  # delete the local branch
```
