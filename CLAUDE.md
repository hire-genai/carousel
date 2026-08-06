# CLAUDE.md

# 🚨 Mandatory Development Rules

These rules are mandatory for every task.

Failure to follow these rules means the implementation is incorrect.

---

# Rule 1 — Analyze Before Coding

NEVER start coding immediately.

For every request:

- Read all related files.
- Understand the architecture.
- Understand the feature flow.
- Understand the database.
- Understand APIs.
- Understand helper functions.
- Understand utilities.
- Understand reusable components.

Never assume anything.

Never generate code without analysis.

---

# Rule 2 — Explain Your Understanding

Before writing code you MUST explain:

- What already exists.
- What the current implementation does.
- What is missing.
- What should change.
- Which files require modification.
- Why those files are correct.

Do not implement until analysis is complete.

---

# Rule 3 — Search Before Creating

Before creating ANYTHING search the project.

Search for:

- function
- helper
- hook
- utility
- API
- component
- service
- model
- schema

If something already exists,

reuse it.

Never duplicate code.

---

# Rule 4 — Minimal Changes Only

Write the smallest possible implementation.

Examples:

If 5 lines solve it,
never write 50.

If 1 function can be modified,
never create 3 new helpers.

If an existing API can be extended,
never create another API.

Less code is better.

---

# Rule 5 — Preserve Architecture

Never replace working architecture.

Never rewrite working modules.

Never redesign the project.

Instead:

- extend
- integrate
- reuse

---

# Rule 6 — Never Duplicate Logic

One problem must have one implementation.

Never implement the same logic twice.

If similar logic exists,

reuse it.

---

# Rule 7 — Modify Before Creating

Prefer

Modify Existing File

instead of

Create New File

Every new file must have a strong technical reason.

---

# Rule 8 — Match Existing Style

Follow existing:

- architecture
- folder structure
- naming
- types
- interfaces
- logging
- validation
- error handling

Do not introduce another coding style.

---

# Rule 9 — Production Quality

Everything must be:

- reusable
- modular
- scalable
- maintainable
- typed
- production-ready

---

# Rule 10 — Performance

Avoid

- duplicate queries
- duplicate loops
- duplicate API calls
- duplicate rendering

Reuse already available data.

---

# Rule 11 — Backward Compatibility

Never break existing features.

Every new implementation must work with existing code.

---

# Rule 12 — Think Before Refactoring

Never refactor because "it looks better."

Only refactor if there is a technical reason.

Existing working code has priority.

---

# Rule 13 — Existing Flow First

Always preserve existing flow.

Never replace:

- Scheduler
- Worker
- Authentication
- Database
- APIs
- Business Logic

Integrate with them.

---

# Rule 14 — Verify Before Finish

Before completing every task verify:

✅ Existing architecture preserved

✅ Existing code reused

✅ No duplicate code

✅ No unnecessary helpers

✅ No unnecessary files

✅ No unnecessary APIs

✅ Minimal code changes

✅ Production ready

---

# Rule 15 — Golden Rule

STOP.

ANALYZE.

UNDERSTAND.

REUSE.

THEN IMPLEMENT.

Never do these in reverse order.

---

# Index Files — Always Read First

At the start of every session and every task, read these files in order:

1. PROJECT_INDEX.md — locate relevant files before searching
2. ARCHITECTURE.md — understand the system before touching it
3. TOKEN_EFFICIENCY.md — work efficiently, minimal reads

Never skip this step.
