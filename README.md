# Solace — corporate wellbeing demo

A frontend-only Next.js App Router and TypeScript application for the Consultant / Admin journey. Production uses a standard Next.js static export. Next.js Link and router transitions run in the browser; there is no server rendering dependency between modules. The managed local preview uses the compatible Vinext runtime. Application data stays in the browser; no API keys or database are needed.

## Run locally

Requires Node 22.13+ and the pnpm version declared in package.json.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

```sh
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

The source uses Next.js routing, layouts, metadata, client components and TypeScript. Sites preview runs through the managed preview supervisor; on a normal development machine `pnpm dev` serves the app.

## Suggested client walkthrough

1. Open Overview. Explain clients, engagements, participation and the featured journey.
2. Use Corporate clients to inspect Meridian Technologies or create a fictional client.
3. Create an engagement, pick a program template, and review its configuration.
4. Add an activity/session and enroll an employee through Employees.
5. Try Import CSV: download the sample, upload it, review validation and import valid rows.
6. Open Thrive at Meridian in Engagements. Navigate freely through all four stages.
7. In Pre-assessment, review Movement & energy and record a pending employee's score.
8. Explore Activities & sessions, update attendance, and review the program agenda and resources.
9. Open Ongoing assessments to record a check-in and inspect follow-up candidates.
10. Use the completed Everyday energy engagement to show final outcomes and a completed journey.
11. Open Reports & insights, filter data, generate a report preview, export CSV, or Print / Save as PDF.
12. Show the role switcher. HR and Employee are intentional future-preview states.

## Demo behavior

- Seed data: 3 clients, 36 employees, 4 engagements and 3 program templates.
- All names, addresses, emails, assessment records and metrics are fictional.
- Changes are saved under `solace-v1` in localStorage in the current browser only.
- Open the Sarah Mitchell profile menu and choose Reset demo data to restore the original scenario.
- There is no authentication, real RBAC, messaging, calendar integration, backend or cloud upload.
- Resource file selections store filenames only. Included guides work as local HTML resources.
- Report printing uses the browser's PDF capability; no PDF file is uploaded or generated on a server.
- CSV imports validate required columns, empty fields, email format and duplicates. Invalid rows are explicitly skipped on confirmation. Export cells are escaped, including spreadsheet formula prefixes.
- The displayed index is an illustrative self-reported wellbeing score (0–100), never a clinical measure. Phase averages can include different respondents. No composite score mixes medical measurements.
- Participation means an active enrolled employee has at least one assessment result or attendance record. Assessment completion means recorded results divided by assignments for the current audience. Report date filters apply to result dates, not attendance.
- Recurrence is a scheduling label in this frontend demo; it does not create future occurrences automatically.
- Changing enrollment preserves existing result records. Employee profiles retain those historical results, while active engagement metrics use current enrollment.
- Engagement completion requires results for all current final-assessment assignments.

## Structure

`app/` contains the six routes. `components/solace/` contains the workspace, module screens and reusable forms. `lib/solace/` contains typed entities, seeded data, derived metrics, browser persistence and CSV utilities. Existing accessible UI primitives are composed from `components/ui/`.
