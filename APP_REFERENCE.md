# School Register: App Reference

A marksheet insight tool for teachers. Teachers enter or import exam marks for a class, and the app turns them into insights: pass rate, weakest and strongest subjects, performance bands, and a list of students who need attention.

---

## 1. Tech Stack

| Layer | Tool |
|---|---|
| UI | React 19 + TypeScript, Vite 6 |
| Styling | Tailwind CSS v4 (custom palette, serif titles, mono tags) |
| Charts | Chart.js (bar charts only) |
| Icons | lucide-react |
| Spreadsheet parsing | SheetJS (`xlsx`) |
| Auth + cloud DB | Supabase (email/password auth, one `user_classes` table) |
| Offline storage | Browser `localStorage` |

Run it with `npm install`, then `npm run dev` (port 5173). Type-check with `npm run lint`.

---

## 2. How a User Moves Through the App

```
Login ──► Home (all classes) ──► Class (list of exams) ──► Exam
  │                                                       ├─ Enter Marks tab
  └─ "Continue as Guest" (local only)                     └─ Class Insights tab
```

There is no router. `App.tsx` switches screens with a `screen` state value (`'login' | 'home' | 'class' | 'exam'`).

---

## 3. Data Model (`src/types.ts`)

```
ClassItem   { id, grade, section, exams[] }
  └─ ExamItem   { id, name, dateLabel, attendance, subjects[], students[], updatedLabel }
       ├─ SubjectItem { id, name, max, pass }
       └─ StudentItem { id, roll, name, marks: { [subjectId]: number | 'AB' | 'NA' | '' } }
```

What each mark value means:
- **number**: the score.
- **`AB`**: absent. It counts as **0** in subject averages and in the student's overall %, as "needs support" in the on-track counts, as "Below passing" in the band chart, and as a fail in the pass rate.
- **`NA`**: optional or not taken. It is skipped in every calculation.
- **`''`**: not entered yet. It is also skipped, so a half-entered exam doesn't show falsely low averages.

**Subject average** = sum of the numeric marks / (students with a number + students marked AB). **Average %** = subject average / max x 100. All averages come from `subjectAverage()` in `stats.ts`, so the Enter Marks footer and the Insights tab always agree.

Each exam keeps its own copy of the roster and subjects. When you create a new exam, the roster and subjects are copied from the class's latest exam with marks cleared, but `NA` marks are kept.

---

## 4. File-by-File Guide

### Root / Shell
| File | What it does |
|---|---|
| `src/main.tsx` | React entry point. |
| `src/App.tsx` | **The brain.** Holds all app state (classes, current screen, selected class and exam, user, sync status). Defines every create, update, and delete handler and handles saving to localStorage and Supabase. |
| `src/index.css` | Tailwind import, fonts, and the fade animation. |

### Screens and Components (`src/components/`)
| Component | What it does |
|---|---|
| `LoginScreen` | Full-page sign in or sign up through Supabase, plus a "Continue in Guest Mode" button. |
| `Header` | Shows the breadcrumb and page title, the signed-in user and sync status ("Saving…", "Cloud Synced", "Sync error") or a "Guest / Local Mode" badge, and a **Reset Demo** button. Hidden on the login screen. |
| `HomeScreen` | Grid of class cards (grade and section, student count, exam count, latest exam status). Has an inline "Add Class" form. |
| `ClassScreen` | Lists the class's exams, newest first, each with a status pill (Not started, In progress, Completed). Buttons: **Enter Marks**, **View Insights**, delete exam, **New Exam**, **Import Exam from Sheet**, and delete class. |
| `ExamScreen` | Exam header fields (name, date, class attendance %) and tab switching between the two tabs below. |
| `EnterMarksTab` | The editable marks table. Add or remove students and subjects, rename them, and set max and pass marks per subject. Cells accept numbers, `AB`, or `NA`, and are colour-coded (red means below pass). Shows each student's total % and a class-average footer row. Can also import a sheet, which **replaces** the current exam's subjects and students. |
| `ClassInsightsTab` | **The insights dashboard.** See section 5. |
| `ChartComponents` | Three Chart.js bar charts: `DistributionChart` (overall bands), `OverviewChart` (on track vs. needs support vs. absent per subject, with optional count labels on the bars), and `DetailChart` (band split for one subject). |
| `ChartModal` | Reusable large pop-out panel (rendered into `document.body`; closes with Esc, X, or a click outside). Currently used by "Subjects at a glance"; it can be reused for other charts. |
| `SubjectMultiSelect` | Checkbox dropdown (an "All subjects" option plus a count per subject) used to filter the Needs attention list. |
| `ExcelImportModal` | Upload by drag-and-drop or file picker (`.xlsx`, `.xls`, `.csv`, `.json`). Previews the detected subjects and first 5 students, and lets you rename subjects, change max marks, or drop a subject before confirming. |
| `AuthModal` | Popup version of the login form. Currently **unused**: nothing ever opens it, and the header sends users to `LoginScreen` instead. |
| `StudentProfilePanel` | **Empty file.** Placeholder for a future per-student view. |

### Logic
| File | What it does |
|---|---|
| `src/utils/stats.ts` | **The insights engine.** Pure functions: `computeInsights`, `subjectAverage`, `studentTotals`, `studentPct`, `bandForMark`, `overallBand`, `examStatus`, and the mark checks (`isAbsent`, `isNA`, `isNumericMark`). Also holds the band colours and labels. |
| `src/utils/excelParser.ts` | Turns a spreadsheet into subjects and students. See section 6. |
| `src/data/seed.ts` | Demo data (Grade 10A, 10B, 6A), localStorage load and save (key `school_register_classes_v1`), and `generateId`. |
| `src/services/dbService.ts` | Supabase CRUD: `loadClassesForUser`, `syncClassToSupabase`, `syncAllClassesToSupabase`, `deleteClassFromSupabase`. |
| `src/lib/supabase.ts` | Creates the Supabase client from env vars. Exports `isSupabaseConfigured`; when that is false, the app runs local-only. |
| `supabase_schema.sql` | Creates the `user_classes` table and its row-level security policies. Run it once in the Supabase SQL editor. |

---

## 5. What the Insights Show (`ClassInsightsTab` + `computeInsights`)

Only **valid students** are counted: students with at least one mark entered (a number, `AB`, or `NA`).

**Headline cards**
1. **Needs the most support**: the subject with the lowest average % (AB counted as 0). Subjects with no marks yet are ignored.
2. **Doing well**: the subject with the highest average %.
3. **Pass rate**: students who reached the pass mark in *every* subject they took. `AB` counts as a fail.
4. **Needs attention**: the number of students who are below pass or absent in at least one subject.
5. **Class attendance**: the value entered by hand on the exam. It turns red below 75%.

**Charts and tables**
- **Whole-class distribution**: each student's overall % grouped into 5 bands.
- **Subjects at a glance**: for each subject, how many students are on track (60% or more), need support, or were absent (a grey segment, shown only when someone was absent).
  - The chart grows by about 30 pixels per subject instead of squeezing into a fixed box. The card shows the first 7 subjects, with a **Show all N subjects** link.
  - The **expand** icon (top right) opens a large panel. It has count labels on every bar, a **Register order / Most needing support** sort, and a table of on track, needs support, absent, and counted students. The sort is not saved.
- **One-subject breakdown**: pick a subject from the dropdown to see its class average as one figure (`60.6 / 100 (61%)`), its range, its on-track count, and its band chart. An amber **Absent: N** chip appears only when someone was absent. Hovering over it shows the average of the students who appeared.
- **Subject breakdown table**: **sorted from highest to lowest average %**. It uses % rather than raw marks, because subjects can have different maxima. Subjects with no marks go last. Columns: max, pass, **Appeared** (e.g. `14 / 15`, with an "AB" count underneath), class average and average % (AB counted as 0), **Avg (Appeared)** (the average of the students who sat the exam), highest and lowest (students who appeared only), and on-track count. Every other view keeps register order.
- **Needs attention list**: each flagged student with tags such as `Maths (22/100)` or `English (Absent)`, sorted with the most issues first.
  - **Subject filter** (`SubjectMultiSelect`): a checkbox dropdown that defaults to *All subjects*. Each subject shows how many students are flagged in it. Ticking one or more subjects shows students struggling in **any** of them, with only those subjects' tags, sorted by matching issues and then roll number. **Clear** resets it. The filter is not saved, and the headline "Needs attention" card always shows the unfiltered count. The dropdown is hidden when the exam has only one subject.
- **Full class grid** (collapsible): every student and subject as a colour-coded heatmap. A dot marks a below-pass score.
  - **Total** (e.g. `232 / 400`) and **%** columns use `studentTotals()`, with AB counted as 0 and NA excluded. Because NA is excluded, the maximum can differ between students. The footer therefore shows only the class average %, not a total.
  - **Sort**: Roll no. (the default), Highest %, or Lowest %. It sorts by %, not raw total, so students with NA subjects are compared fairly. Ties are broken by roll number. The sort is not saved.
  - There is deliberately **no rank column**, in line with the NEP 2020 / CBSE move away from publicly ranking students. "Lowest %" is the view for deciding who to help first.

**Performance bands**

| Band | Label | Per-subject rule | Overall rule |
|---|---|---|---|
| 5 | Excellent | 90% or more | 90% or more |
| 4 | Good | 75% or more | 75% or more |
| 3 | Satisfactory | 60% or more | 60% or more |
| 2 | Needs practice | at or above the pass mark | 35% or more |
| 1 | Below passing | below the pass mark | below 35% |

**Exam status**: *Not started* means no marks are filled in, *In progress* means some are, and *Completed* means every cell is filled. The "View Insights" button is disabled while an exam is *Not started*.

---

## 6. Spreadsheet Import Rules (`excelParser.ts`)

- Reads only the **first sheet**.
- Looks in the first 12 rows for the **header row**, which is the first row containing "name" or "student".
- Detects the **Roll** column (roll, s.no, sl.no, #) and the **Name** column automatically.
- **Ignores non-subject columns** such as Total, %, Rank, Grade, Result, Attendance, Remarks, Adm No, DOB, and Section.
- **Skips footer rows** such as Total, Average, Highest, Pass Count, and Signature rows.
- **Max marks** are read from the header when present, e.g. `English (80)`, `Maths [100]`, `Hindi: 50`. The default is 100. If a student scored above max, max is rounded up to the next 10.
- **Pass mark** is always set to 33% of max.
- **Cell values**: `AB`, `ABS`, `A`, or `Absent` become `AB`. Blank cells, `NA`, `-`, `Exempt`, `Nil`, Excel errors (`#DIV/0!` etc.), and any other text become `NA`.
- A **JSON** file that already has `{ subjects, students }` is loaded as-is.
- Anything skipped or assumed is shown as a warning in the preview.

---

## 7. Storage and Sync

| Mode | Where data lives |
|---|---|
| Guest (not signed in, or Supabase not configured) | `localStorage` only. The first launch loads the demo seed data. |
| Signed in | Loads from the Supabase `user_classes` table (one row per class, with all exams stored as JSONB). Every change is saved to Supabase and also mirrored to `localStorage`. |

- Row-level security means each teacher can only read and write their own rows.
- A brand-new signed-in user starts with **no classes** (no demo data).
- **Reset Demo** replaces all classes with the seed data. For a signed-in user, this is also synced to the cloud.

**Environment variables** (`.env`, see `.env.example`):
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
`GEMINI_API_KEY` and `APP_URL` come from the AI Studio template and are **not used** by the code yet.

---

## 8. Known Gaps and Cleanup Candidates

- `StudentProfilePanel.tsx` is empty, and `AuthModal.tsx` is never opened (dead code).
- `@google/genai`, `express`, and `dotenv` are installed but not used, so there is no AI-generated insight yet.
- **Double writes to Supabase**: each handler syncs right away, *and* an effect in `App.tsx` also upserts **all** classes 600 ms later.
- **Every edit sends the whole class**, including all its exams, to Supabase. This is fine at small scale but heavy for large classes.
- **Shared-computer privacy issue**: signed-in data is mirrored to `localStorage` and not cleared on sign-out, so the next guest on the same browser can see the previous teacher's classes.
- The Excel import inside **Enter Marks** overwrites the whole exam without asking for confirmation.
- Pass mark on import is fixed at 33%. It can be changed afterwards in the Enter Marks table header.
- Attendance is one number per exam that the teacher types in, not tracked per student.
- There is no comparison across exams (e.g. Term 1 vs. Term 2 trends).
- `package.json` is still named `react-example`, and `README.md` is the AI Studio boilerplate.
