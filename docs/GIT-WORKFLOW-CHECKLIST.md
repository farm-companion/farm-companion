# Git Workflow Checklist - Safe Incremental Development

**Purpose:** Ensure every slice is safely merged to master with proper review and local sync.

**Rule:** One slice = one commit = one PR = one merge cycle

---

## WORKFLOW: After Every Slice

Follow these steps **EXACTLY** after completing each slice:

---

### ✅ STEP 1: Verify Changes Are Committed

**Run:**
```bash
git status
```

**Expected:**
```
On branch claude/<feature-branch>
nothing to commit, working tree clean
```

**If not clean:** Something went wrong. Changes should already be committed.

---

### ✅ STEP 2: Verify Changes Are Pushed to Remote

**Run:**
```bash
git log origin/claude/<feature-branch>..HEAD
```

**Expected:**
```
(empty output = everything pushed)
```

**If commits shown:** Push them:
```bash
git push origin claude/<feature-branch>
```

---

### ✅ STEP 3: Create Pull Request

**Option A: Click Direct Link**
```
https://github.com/farm-companion/farm-companion/compare/master...claude/<feature-branch>?expand=1
```

**Option B: Via GitHub UI**
1. Go to: https://github.com/farm-companion/farm-companion/pulls
2. Click "New pull request"
3. Set base: `master`, compare: `claude/<feature-branch>`
4. Click "Create pull request"

**PR Title Format:**
```
feat/fix/docs: Brief description - Queue X, Slice Y
```

**PR Description Template:**
```markdown
## Summary
Brief description of what changed.

## Changes
- Change 1
- Change 2
- Change 3

## Visual Impact
What you'll see different on the site.

## Testing
- [x] Build passes
- [x] TypeScript clean
- [x] Verification command output

## Files Changed
X files, Y lines changed

## Next Steps
Queue X, Slice Y+1: Description
```

---

### ✅ STEP 4: Review PR on GitHub

**Check:**
- [ ] Files changed tab shows correct files
- [ ] No unexpected changes
- [ ] Diff looks correct
- [ ] No merge conflicts

---

### ✅ STEP 5: Merge the PR

**On GitHub PR page:**
1. Click "Merge pull request"
2. Choose merge strategy:
   - **Squash and merge** (recommended for clean history)
   - **Create a merge commit** (keeps all commits)
3. Click "Confirm merge"
4. **WAIT for confirmation:** "Pull request successfully merged"

---

### ✅ STEP 6: Update Your Local Master (CRITICAL)

**This is where most people miss - DON'T SKIP!**

**Run these commands in order:**
```bash
# 1. Switch to master branch
git checkout master

# 2. Pull latest from remote (includes your merged PR)
git pull origin master

# 3. Verify you have the changes
git log -1 --oneline
# Should show your merge commit

# 4. Verify files have changes
# Example: Check if tailwind.config.js has secondary colors
grep -c "secondary:" farm-frontend/tailwind.config.js
# Should return 1 (or expected count)
```

**Expected output:**
```
Switched to branch 'master'
Your branch is up to date with 'origin/master'.
Updating 04453e1..ad9bc87
Fast-forward
 CLAUDE.md | 39 +++++++++++++++
 farm-frontend/tailwind.config.js | 40 +++++++++++++++
 ...
X files changed, Y insertions(+)
```

---

### ✅ STEP 7: Verify Local Files Match Master

**Run verification commands from the slice:**
```bash
# Example for Queue 8, Slice 1:
grep "secondary:" farm-frontend/tailwind.config.js
grep "neutral-" farm-frontend/src/components/ui/Skeleton.tsx

# Should see the changes in your local files NOW
```

**If you DON'T see changes:**
```bash
# Check which branch you're on
git branch --show-current
# Must say: master

# Check if master is up to date
git status
# Should say: "Your branch is up to date with 'origin/master'"

# If behind, pull again
git pull origin master
```

---

### ✅ STEP 8: Clean Up Feature Branch (Optional)

**Delete remote feature branch:**
```bash
git push origin --delete claude/<feature-branch>
```

**Delete local feature branch:**
```bash
git branch -d claude/<feature-branch>
```

**Note:** GitHub can also delete the branch automatically after merge (checkbox on PR).

---

### ✅ STEP 9: Create New Feature Branch for Next Slice

**Before starting next slice:**
```bash
# Make sure you're on master
git checkout master

# Create new branch for next slice
git checkout -b claude/<next-slice-name>-<session-id>

# Example:
git checkout -b claude/typography-system-tYCf8
```

---

## TIMING & FREQUENCY

### When to Create PR:
- **IMMEDIATELY** after completing a slice
- **NEVER** wait to accumulate multiple slices
- **ONE** slice = **ONE** PR

### When to Merge PR:
- **SAME DAY** if possible (keeps branches fresh)
- **BEFORE** starting next slice (preferred)
- **MAXIMUM** 3 unmerged PRs at once (hard limit)

### When to Update Local Master:
- **IMMEDIATELY** after merging each PR
- **BEFORE** starting work on next slice
- **VERIFY** changes are in local files before continuing

---

## SAFETY CHECKS

### Before Starting Next Slice:

Run this checklist:
```bash
# 1. On master branch?
git branch --show-current
# Must show: master

# 2. Master up to date?
git status
# Must show: "Your branch is up to date"

# 3. Working directory clean?
git status
# Must show: "nothing to commit, working tree clean"

# 4. Latest changes present?
# Run verification commands from previous slice
# Example: grep "secondary:" farm-frontend/tailwind.config.js
```

**If ANY check fails:** STOP and fix before continuing.

---

## COMMON MISTAKES TO AVOID

### ❌ Mistake 1: Not Pulling Master After Merge
```
Result: Your local files don't have the changes
Fix: git checkout master && git pull origin master
```

### ❌ Mistake 2: Working on Outdated Master
```
Result: Merge conflicts, outdated base
Fix: Always pull master before creating new branch
```

### ❌ Mistake 3: Accumulating Multiple Slices
```
Result: Large PR, hard to review, risky merge
Fix: Create PR after EVERY slice
```

### ❌ Mistake 4: Forgetting to Push Before PR
```
Result: PR doesn't exist or is empty
Fix: git push origin <branch> first
```

### ❌ Mistake 5: Not Verifying Local Changes
```
Result: Think changes are live, but they're not
Fix: Verify files after pulling master
```

---

## VISUAL DIAGRAM

```
SLICE COMPLETED
    ↓
[Commit] → [Push] → [Create PR]
                         ↓
                    [Review PR]
                         ↓
                    [Merge PR] ← YOU DO THIS ON GITHUB
                         ↓
[Switch to master] ← YOU DO THIS LOCALLY
    ↓
[Pull master] ← CRITICAL - DON'T SKIP
    ↓
[Verify files have changes] ← CHECK YOUR ACTUAL FILES
    ↓
[Create new branch for next slice]
    ↓
READY FOR NEXT SLICE ✅
```

---

## EXAMPLE: Complete Workflow for Queue 8, Slice 1

### Assistant completes slice:
```bash
git add .
git commit -m "feat: design token consolidation - Queue 8, Slice 1"
git push origin claude/investigate-farmcompanion-forensics-tYCf8
```

### You create PR:
- Click: https://github.com/farm-companion/farm-companion/compare/master...claude/investigate-farmcompanion-forensics-tYCf8
- Title: "feat: Design token consolidation - Queue 8, Slice 1"
- Click "Create pull request"

### You merge PR:
- Review files changed
- Click "Merge pull request"
- Click "Confirm merge"

### You update local master:
```bash
git checkout master
git pull origin master

# Verify
grep "secondary:" farm-frontend/tailwind.config.js
# Should return: secondary: {
```

### You create next branch:
```bash
git checkout -b claude/typography-system-tYCf8
```

### Ready for next slice! ✅

---

## TROUBLESHOOTING

### "I don't see the changes in my files"

**Check 1:** Which branch are you on?
```bash
git branch --show-current
```
Must be `master` to see merged changes.

**Check 2:** Did you pull master?
```bash
git log -1 --oneline
```
Should show your merge commit.

**Check 3:** Are you looking at the right file?
```bash
# Full path should be:
/Users/abuaa/Projects/farm-companion/farm-frontend/tailwind.config.js
```

---

### "PR shows merge conflicts"

**Cause:** Master was updated since you created feature branch.

**Fix:**
```bash
# On your feature branch
git checkout claude/<feature-branch>

# Pull latest master
git pull origin master

# Resolve conflicts in editor
# Then:
git add .
git commit -m "Resolve merge conflicts"
git push origin claude/<feature-branch>
```

---

### "Can't push to master (403 error)"

**This is CORRECT!** Branch protection is working.

**You MUST use Pull Request workflow** - never push directly to master.

---

## SUMMARY

**The Golden Rule:**
> After EVERY slice: Commit → Push → PR → Merge → Pull master → Verify files → New branch

**The Critical Step Most People Miss:**
> `git checkout master && git pull origin master`

**How to Know You Did It Right:**
> Open your actual files in VS Code/Finder. Do you see the changes? YES = ✅ NO = ❌

---

**Questions?** See CLAUDE.md "Git workflow" section for full rules.
