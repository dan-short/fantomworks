# Current-State Audit — FantomWorks Call Log

Reverse-engineered from the legacy PHP source in `call-log/` and `submission/`.
This is our understanding *before* seeing a real DB dump — confirm against the actual
schema once we have an export.

## Stack today
- **Host:** GoDaddy shared hosting, MySQL/MariaDB, phpMyAdmin
- **Language:** PHP (procedural, `mysqli`, string-interpolated SQL)
- **Database:** `fantomwo_call_log`
- **Subdomains:**
  - `projects.fantomworks.com` — public submission form (`submission/index.html`) + `/uploads` image dir + `admin.html`
  - `calls.fantomworks.com` — internal call-log viewer/workflow app (this is the piece Dad uses daily)

## The daily workflow (from `call-log/index.php`)
Submissions move through a pipeline, tracked by boolean flag columns rather than a status enum:

```
Call Log  ->  Pending  ->  Active (Confirmed)  ->  Finished
   |            (Possibles / Office)      (Archives, Recently Archived)
```

- The main **Call Log** view = `WHERE Archived=0 AND Pending=0 AND Deleted=0 AND Confirmed=0 AND Office=0`
- Each pipeline page (`pending.php`, `confirmed.php`, `finished.php`, `office.php`, `archives.php`, `recent.php`) filters on a different flag combo.
- Rows are **color-coded by age** of `Received_Date`: green <30d, yellow 30–60d, red 60–90d, dark red >90d.
- Per-row actions POST to `functions/*.php`: `call_attempt_one/two/three`, `email_attempt`, `notes`, `bump` (send to top), `delete`, `archive`, `pending`, `confirmed`, `sendtooffice`, `thanks-nothanks`, `email`, `generic_email`, `search`, `master_search`.
  - ⚠️ **We do not yet have these `functions/*.php` files** — only `index.php` and `calllogprocessor2.php`. Needed to fully spec Phase 3 (write actions).

## Reconstructed schema

### `Project_Submissions` (the core table)
| Column | Inferred type | Notes |
|---|---|---|
| `ID` | INT PK AUTO_INCREMENT | |
| `First_Name`, `Last_Name` | VARCHAR | |
| `Phone`, `Alt_Phone` | VARCHAR | stored pre-formatted `(xxx) xxx-xxxx` |
| `CallSchedule` | VARCHAR/TEXT | customer's preferred call time |
| `Email` | VARCHAR | |
| `ZipCode` | VARCHAR | note: code treats `!=5 chars` as "unknown distance" |
| `City`, `State_Country`, `Time_Zone` | VARCHAR | |
| `Distance` | INT | miles from shop (23517), computed via `ZipCodes` lat/long at insert time |
| `Year`, `Make`, `Model` | VARCHAR | vehicle |
| `Budget` | numeric | **read by viewer, NOT written by processor** — likely legacy/edited manually |
| `Project_Start` | VARCHAR | |
| `Project_Description` | TEXT | |
| `Received_Date` | DATE | set to `CURDATE()` on insert |
| `Original_Date` | DATE | sentinel `'0000-00-00'` when unset (bump feature) |
| `Added_By` | VARCHAR | `'Online Form'` or a staff name |
| `Notes` | TEXT | |
| `ImageName_1..4` | VARCHAR | filenames in `projects.fantomworks.com/uploads/` |
| `CallAttemptOne/Two/Three` | VARCHAR/DATETIME | timestamp of each call attempt |
| `EmailAttempt` | VARCHAR/DATETIME | |
| `Archived`,`Pending`,`Deleted`,`Confirmed`,`Office` | flag (`'0'`/`'1'`) | pipeline state |
| `Parts_Policies`, `Guarantee_Warranty_Policies`, `Storage_Fees_Policies`, `Paint_Changes_Everything`, `Estimate_Terms` | VARCHAR | policy acknowledgements |

### `Project_Desc` (1:1 with a submission, keyed by `ID`)
Long-form project breakdown. Columns observed:
`DisDesc`, `MediaDesc`, `FabDesc`, `ChassisDesc`, `DriveDesc`, `AssemDesc`, `TestDesc`,
`BodyDesc`, `PaintDesc`, `ElecDesc`, `ExtDesc` (Owner Labor Estimate), `WringDesc` (Owner Part Estimate),
`IntDesc` (Additional Notes). All TEXT.

### `ZipCodes` (reference/lookup)
`Zip_Code` (PK), `Latitude`, `Longitude`. Used only to compute `Distance` at insert. ~40k US rows — a static reference table we can import once and forget.

## Data-quality / correctness notes to carry into the migration
- Dates use MySQL's `'0000-00-00'` sentinel — **Postgres rejects these**; must map to `NULL`.
- Booleans are stored as `'0'`/`'1'` strings/tinyints — normalize to real `boolean`.
- The five pipeline flags are mutually-exploratory; consider collapsing into a single `status` enum (`new`, `pending`, `active`, `finished`, `possible`, `archived`, `deleted`) in the new schema for sanity, while keeping the raw flags during migration for a lossless first pass.
- `Distance` is denormalized (computed once). Fine to keep as a stored column.
- Legacy SQL is string-interpolated (injection-prone) and creds were hardcoded — the new stack fixes both by construction (parameterized queries + RLS + env vars).
