# TOKEN_EFFICIENCY.md

# Purpose

Minimize token usage while maintaining code quality.

These rules are mandatory.

---

# Rule 1 — Read Only What Is Needed

Never scan the entire repository.

Only read files directly related to the task.

Do not recursively inspect unrelated folders.

Avoid loading unnecessary context.

---

# Rule 2 — Search First

Always search before reading files.

Locate the relevant implementation first.

Only open files that are actually required.

---

# Rule 3 — Avoid Full File Reads

Never read an entire large file unless necessary.

Read only the relevant functions or sections first.

Expand context only if required.

---

# Rule 4 — Don't Re-Read Files

If a file has already been analyzed during this task,

do not read it again unless it has changed.

Reuse previous understanding.

---

# Rule 5 — No Repository-Wide Analysis

Never perform project-wide analysis unless explicitly requested.

Focus only on the feature being implemented.

---

# Rule 6 — Short Reasoning

Keep internal reasoning concise.

Do not generate long explanations.

Think efficiently.

---

# Rule 7 — Concise Responses

Keep explanations short.

Avoid repeating information.

Avoid large summaries unless requested.

---

# Rule 8 — Minimal Code Generation

Generate only the code required.

Do not generate alternative implementations unless asked.

Do not generate example code unless requested.

---

# Rule 9 — Modify Instead of Rewrite

Modify existing functions whenever possible.

Avoid rewriting complete files.

---

# Rule 10 — Avoid Duplicate Searches

If a helper/API/component has already been found,

reuse that information.

Do not search for it again.

---

# Rule 11 — Avoid Unnecessary Refactoring

Never refactor code unless explicitly requested.

Working code should remain unchanged.

---

# Rule 12 — Limit File Creation

Do not create new files unless technically required.

Prefer modifying existing files.

---

# Rule 13 — One Solution Only

Provide one best implementation.

Do not generate multiple possible solutions.

---

# Rule 14 — Stop When Done

Once the requested feature is complete,

stop.

Do not continue suggesting unrelated improvements.

---

# Rule 15 — Token Budget

Treat tokens as limited resources.

Every file read, every explanation, and every generated line of code should have a clear purpose.

Avoid unnecessary context.

---

# Session Start Protocol

Every new session:

1. Read PROJECT_INDEX.md (locate files, avoid blind search)
2. Read ARCHITECTURE.md (understand system)
3. Read TOKEN_EFFICIENCY.md (stay efficient)
4. Then read ONLY the files needed for the task

Never read files not listed in PROJECT_INDEX.md unless the task requires a new file.
