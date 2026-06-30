# TixHub Project Roadmap, Daily Updates, and Final Submission Plan

Generated on: 2026-06-25  
Project name: TixHub Booking Platform  
Owner: Product/Engineering  
Start date: 2026-06-23  
Final project submission date: 2026-09-18  
Current sprint: Sprint 1 - Stabilization  
Current status: Active Development  
Health status: Yellow  

## Project Progress Baseline

| Area | Progress % |
|---|---:|
| Overall Progress | 62 |
| Frontend | 68 |
| Backend | 66 |
| Database | 72 |
| Testing | 28 |
| Deployment | 15 |

## Required Sheets Created

| Sheet/File | Purpose |
|---|---|
| `Project_Roadmap_Daily_Update_Master.csv` | Main day-wise roadmap and daily update sheet with actual hours, blockers, completion %, next day plan, and final submission date |
| `Day_Wise_Work_Distribution.csv` | Clean day-wise planned work distribution from 2026-06-23 to 2026-09-18 |
| `Milestone_Roadmap.csv` | Sprint and milestone-level roadmap |
| `Final_Submission_Checklist.csv` | Final delivery checklist for frontend, backend, database, testing, deployment, documentation, and launch |
| `Projects_Master.csv` | Project summary and progress baseline |
| `Sprint_Tracker.csv` | Sprint health and readiness |
| `Daily_Updates.csv` | Existing daily completed/in-progress update log |

## Daily Update Columns

Use `Project_Roadmap_Daily_Update_Master.csv` every day. Fill these fields after work:

| Column | How to Update |
|---|---|
| Actual Hours | Enter real hours worked for the day |
| Daily Work Update | Write what was completed today |
| Completion % | Update only after verified work is complete |
| Current Status | Planned, In Progress, Done, Blocked |
| Blockers | Add API, UI, DB, testing, deployment, or requirement blockers |
| Next Day Plan | Carry pending work to next day |
| Health Status | Green, Yellow, or Red |

## Final Submission Criteria

The project should be submitted on 2026-09-18 only after:

| Area | Submission Requirement |
|---|---|
| Frontend | `npm.cmd run build` passes and all user/vendor/admin flows are visually checked |
| Backend | Server starts, changed JS files pass `node --check`, auth and booking APIs pass smoke tests |
| Database | Schema/migrations are documented, backup and restore plan is ready |
| Testing | Full regression and UAT reports are complete, critical/high bugs closed |
| Deployment | Environment config, health check, staging rehearsal, and production checklist are complete |
| Documentation | Final report, roadmap, daily update sheet, submission checklist, and handoff notes are ready |

## Sprint Roadmap

| Sprint | Date Range | Focus | Expected Output |
|---|---|---|---|
| Sprint 1 - Stabilization | 2026-06-23 to 2026-07-05 | Movie booking, vendor dashboard, QR, live seats | Movie booking and vendor movie operations stable |
| Sprint 2 - Core Booking Expansion | 2026-07-06 to 2026-07-19 | Flight booking, wallet, vendor flight operations | Movie and flight booking flows stable |
| Sprint 3 - Admin and Multi-Service Vendor | 2026-07-20 to 2026-08-02 | Admin, hotel, bus, train, vendor modules | Admin and all vendor service basics usable |
| Sprint 4 - QA and Hardening | 2026-08-03 to 2026-08-23 | Regression, security, validation, performance | Release candidate prepared |
| Sprint 5 - UAT and Deployment | 2026-08-24 to 2026-09-18 | UAT, production setup, deployment, launch | Final project submitted |

## Milestone Dates

| Milestone | Date |
|---|---|
| Sprint 1 complete | 2026-07-05 |
| Sprint 2 complete | 2026-07-19 |
| Sprint 3 complete | 2026-08-02 |
| Release candidate ready | 2026-08-23 |
| UAT signoff complete | 2026-09-12 |
| Final project submission | 2026-09-18 |

## Daily Work Timing

| Time | Work |
|---|---|
| 10:00 AM - 01:00 PM | Frontend implementation |
| 02:00 PM - 04:30 PM | Backend/API/database implementation |
| 04:30 PM - 05:30 PM | Testing and smoke checks |
| 05:30 PM - 06:00 PM | Daily update sheet and next-day plan |

## Current Health Notes

| Risk | Status | Action |
|---|---|---|
| Testing progress is low | Red | Add daily regression work from 2026-08-03 |
| Deployment progress is low | Red | Start deployment readiness by 2026-08-17 |
| Payment integration is early/mock-level | Yellow | Complete payment verification before UAT |
| Multi-service vendor modules need consistency | Yellow | Stabilize movie/flight first, then hotel/bus/train |

## How To Use This Pack

1. Open `project-management/google-sheets/Project_Roadmap_Daily_Update_Master.csv`.
2. Update today row at the end of each working day.
3. Update `Milestone_Roadmap.csv` when sprint status changes.
4. Update `Final_Submission_Checklist.csv` every week from 2026-08-17 onward.
5. Keep `Expected Completion` and `Final Submission Date` as 2026-09-18 unless product scope changes.
