# OWOcrm — Content & Copy UI Rules

> This document defines how the interface speaks. It covers label writing, button text,
> empty states, warnings, and the tone of all operational UI copy.
> These rules apply to every piece of text inside the product.

---

## 1. Tone of voice

OWOcrm's UI copy is:

**Sharp.** No padding, no filler. Get to the point.

**Clear.** A user who has never seen this product before should understand what any label or button does.

**Professional.** The product is used by people running real businesses. Treat them as such.

**Functional, not friendly.** The interface should be pleasant to use, but it is not a chatbot trying to charm the user. It is a tool. It communicates what the tool is doing.

The tone is NOT:
- Robotic or corporate ("The requested operation was completed successfully.")
- Warm and fluffy ("Great job! You've imported your first leads! 🎉")
- Marketing language inside the product ("Supercharge your pipeline with OWOcrm Stats!")
- Vague ("Something went wrong. Please try again.")
- Passive voice ("The lead was assigned by the system.")

---

## 2. Label rules

Labels name things. They are not sentences.

**Rules:**
- Use title case for section headers and page titles: "Pipeline Stages", "Team Members", "Google Sheet Setup"
- Use sentence case for form field labels: "Business name", "Owner", "Due date"
- Never end a label with a colon in a form context — the input position communicates the relationship
- Keep labels to 1–3 words maximum. If you need 4+ words to name a field, reconsider the information architecture.
- Avoid jargon that the user's business context wouldn't use ("entity", "record", "instance")
- Use the user's natural language for CRM concepts: "lead", "stage", "owner", "task" — not "contact", "pipeline stage entity", "responsible party", "action item"

**Examples:**
```
✓  Lead name
✗  Contact full name

✓  Owner
✗  Responsible team member

✓  Stage
✗  Pipeline stage

✓  Due date
✗  Task completion deadline
```

---

## 3. Button text rules

Buttons name an action. The text must be a verb (or a verb + noun when disambiguation is needed).

**Rules:**
- Primary buttons always start with a verb: "Save", "Import", "Create", "Delete", "Send", "Assign"
- When multiple buttons appear on the same view, disambiguate the verb: "Save changes" vs "Discard changes" rather than "OK" vs "Cancel"
- "Cancel" is acceptable as a secondary action label alongside a specific primary action label. "OK" is never acceptable.
- Don't add "now" to buttons: "Import" not "Import now". "Save" not "Save now".
- Don't add "all" unless it distinguishes from a partial action: "Clear filters" (all is implied), but "Mark all as complete" (when a partial action also exists).
- Confirmation buttons for destructive actions must match the specific action: "Delete lead" not "Confirm". "Remove member" not "Yes, remove".

**Examples:**
```
✓  Import leads          ✗  Submit
✓  Save changes          ✗  OK
✓  Delete lead           ✗  Confirm delete
✓  Discard changes       ✗  Cancel changes
✓  Assign owner          ✗  Set responsible
✓  Add note              ✗  Create new note
```

---

## 4. Empty states

Empty states must answer two questions: why is this empty, and what should I do about it?

**Structure:**
1. Short title (what is missing)
2. One line explanation (why / context)
3. CTA button (what to do)

**Rules:**
- No illustration or decorative elements
- Title: `--text-lg`, `--font-semibold`
- Explanation: `--text-base`, `--color-text-secondary`, max 2 sentences
- CTA: primary or secondary button, depending on urgency

**Examples:**

First-time / no data:
```
No leads yet
Import your existing leads from Google Sheets, or add them manually.
[Import from Google Sheets]  [Add lead]
```

After filter returns nothing:
```
No leads match these filters
Try adjusting your filters to see more results.
[Clear filters]
```

No tasks assigned:
```
No tasks yet
Add a task to track next steps for your leads.
[Add task]
```

Error / failed to load:
```
Couldn't load leads
Check your connection and try again.
[Retry]
```

---

## 5. Confirmation dialogs

Confirmations block an action until the user confirms. Copy must make the stakes clear.

**Structure:**
1. Title: what will happen
2. Body: what the consequence is (especially for irreversible actions)
3. Buttons: specific action verb (primary, danger) + Cancel (secondary)

**Rules:**
- Title must be a statement about the consequence, not a question: "Delete this lead" not "Are you sure?"
- For irreversible actions, say so: "This cannot be undone."
- Keep body text to 1–2 sentences. Don't add boilerplate warnings.
- The confirm button must match the title action verb exactly.

**Example:**
```
Delete this lead?
Jan Kowalski and all their activity, tasks, and notes will be permanently deleted.
This cannot be undone.

[Delete lead]  [Cancel]
```

Not:
```
Are you sure you want to delete this lead?
Once you confirm, the deletion will be permanent and the record cannot be recovered.

[Confirm]  [Cancel]
```

---

## 6. Warnings and informational messages

These appear as inline warning/info bars or as toast notifications.

**Inline warnings:**
- State the issue directly: "This stage has 4 leads. Deleting it will move them to the previous stage."
- Don't hedge: "Note: please be aware that..." — just state it.
- If action is needed: end with a link or button to resolve.

**Toast notifications:**
- Success toasts: past tense, specific. "Lead imported." / "Task marked complete." / "Changes saved."
- Error toasts: present tense, specific. "Couldn't save changes. Check your connection." / "Import failed — verify sheet access."
- Never use "successfully" in toasts. "Lead imported." is cleaner than "Lead imported successfully."

**Examples:**
```
✓  Lead imported.
✗  Your lead has been successfully imported into the system.

✓  Couldn't save changes. Check your connection.
✗  An error occurred while attempting to save. Please try again later.

✓  Changes saved.
✗  Your changes have been saved successfully.
```

---

## 7. Action prompts and guidance text

These are short pieces of copy that guide the user through a flow or explain an unfamiliar concept.

**Rules:**
- Use second person ("you", "your") — the interface talks to the user directly.
- Don't explain the obvious: if the field label is "Lead name", don't add placeholder text "Enter the lead's name".
- Use placeholder text to show format, not repeat the label: phone field placeholder: "+48 601 234 567"
- Step-by-step guidance (e.g., Sheet Sync flow) should explain the *why*, not just the *what*.

**Example (Sheet Sync step 1):**
```
✓  Paste the URL of the Google Sheet containing your leads.
   The sheet must be set to "Anyone with the link can view."
```

Not:
```
✗  In this step, you will need to provide the URL of the Google Spreadsheet
   from which you would like to import your lead data. Please ensure that...
```

---

## 8. Operational interface text — specific rules

**Timestamps:**
- Recent (within 24h): relative. "2 minutes ago", "1 hour ago"
- Yesterday: "Yesterday at 14:32"
- Older: absolute short date. "Mar 28" or "Mar 28, 2025" if older than current year
- Never use ISO format (2025-03-28) in the UI — it is not user-facing friendly

**Lead count / numbers:**
- "34 leads" not "34 lead(s)"
- "1 lead" not "1 leads"
- Singular/plural must always be correct

**Stage names:**
- Rendered exactly as the user defined them. No auto-capitalization, no transformation.
- If a stage name is truncated in a chip, show a tooltip with the full name on hover.

**Ownership:**
- "Unassigned" when no owner. Not "No owner", not "—", not empty.
- "You" when the current user is the owner (where space permits), otherwise first name only.

**Overdue:**
- "Overdue by 2 days" not "Late" not "OVERDUE"
- Keep the actual count visible — the user needs to know how late, not just that it's late.

---

## 9. What this product never says inside the interface

- "Supercharge", "turbocharge", "power up", "unlock the power of"
- "Seamless", "effortless", "hassle-free"
- "World-class", "industry-leading", "cutting-edge"
- "Get started today!" (inside the product — the user is already here)
- "Please don't hesitate to reach out"
- Any variation of "We noticed that you might want to..."
- Exclamation marks used to express enthusiasm. Exclamation marks may appear in warnings only.
