# AGENTS.md — Agent Operating Rules

This file defines the rules that agents (AI or human) MUST follow when working
in this repository. Rules are numbered; a rule may add more detail over time.

本文件定义在本仓库中工作（无论是 AI 还是人类）**必须遵守**的规则。规则编号排列，
后续可继续补充。

---

## Rule 1 — Development workflow: branch → PR → human review → cleanup

## 规则 1 —— 开发流程：分支 → PR → 人工审核 → 清理

Every change MUST go through the following workflow. Never commit directly to
`main`.

任何改动都必须走以下流程，**严禁直接提交到 `main`**。

### 1. Create / enter an isolated branch or worktree
### 1. 创建 / 进入独立的分支或 worktree

```sh
# Option A: branch in the current checkout
# 方案 A：在当前检出里新建分支
git switch -c feat/my-change

# Option B: dedicated worktree (keeps the main checkout clean)
# 方案 B：独立 worktree（保持主检出干净）
git worktree add ../obsidian-wt-my-change -b feat/my-change
```

### 2. Sync with the latest `main` before opening a PR
### 2. 提交 PR 前确认已合并到最新 main

```sh
git fetch origin
git rebase origin/main    # or: git merge origin/main
```

Never open a PR that is behind `origin/main`.

严禁提交落后于 `origin/main` 的 PR。

### 3. Commit, push, open a PR
### 3. 提交、推送、创建 PR

```sh
git add -A
git commit -m "type: short summary"   # conventional commits
git push -u origin feat/my-change
gh pr create --base main --head feat/my-change --title "..." --body "..."
```

### 4. Wait for human review
### 4. 等待人工审核

A PR is merged only after a human reviews/approves it. The agent MUST NOT merge
its own PR and MUST NOT bypass the review process.

PR 只有在人工审核通过后才会合并。Agent **不得自行合并自己的 PR**，**不得绕过审核流程**。

### 5. After the PR is merged: clean up and sync
### 5. PR 合并后：清理并同步

```sh
git checkout main
git pull origin main                    # sync to the latest main / 同步到最新 main
git branch -d feat/my-change            # delete the local branch / 删除本地分支
git worktree remove ../obsidian-wt-my-change   # remove the worktree, if used / 如使用了 worktree 则移除
```
