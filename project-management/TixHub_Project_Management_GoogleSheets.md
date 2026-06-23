# TixHub Project Management Pack

Generated on: 2026-06-23  
Last updated on: 2026-06-23  
Project path: D:\ReactProjectTicketHUB  
Planning assumption: current implementation is functionally partial, with movie booking, flight booking, vendor operations, QR scanning, live movie seats, wallet, admin, and auth already present in code. Completion percentages below are planning baselines and should be updated after each verified sprint.
Continuous update rule: do not recreate this roadmap from scratch. Add new work as new task rows, update completion percentages, move completed tasks to Done, and refresh the daily, weekly, sprint, release, risk, bug, and productivity sheets.

## Complete Feature Breakdown

| Area | Pages / Routes | Modules | Backend APIs | Database Tables | Roles | Status |
|---|---|---|---|---|---|---|
| Authentication | /, /register, /forgot-password, /reset-password/:token | Login, register, password reset, session storage | /api/auth/register, /api/auth/login, /api/auth/me, /api/auth/logout, /api/auth/forgot-password, /api/auth/reset-password/:token | users | user, vendor, admin | In progress |
| User Dashboard Shell | /dashboard/* | DashboardLayout, sidebar, protected routing | /api/bookings, /api/catalog/:module | users, bookings, app_records | user, vendor, admin | In progress |
| Movie Discovery | /dashboard/movies, /dashboard/movies/:id, /dashboard/upcoming-movies | Movie listing, details, theatre selection | /api/movies, /api/movies/:id, /api/movies/:id/reviews | movies, movie_reviews | user | In progress |
| Movie Booking | /dashboard/movies/:id/theatres, /seats, /payment, /confirmation | Show selection, seat map, payment, confirmation | /api/seats/:showId, /api/bookings/movie, /api/payments/create-order, /api/payments/verify | bookings, seats, movie_seats, wallet_transactions | user | In progress |
| QR Tickets | /dashboard/my-bookings, vendor scanner inside VendorDashboard | QR display, scanner, check-in | /api/vendor/ticket-scans, /api/vendor/qr/verify, /api/vendor/qr/check-in | bookings, qr_scans | user, vendor | Mostly complete |
| Flight Search | /dashboard/flights, /dashboard/flights/:id | Flight listing, details, filters | /api/flights, /api/flights/:id, /api/flights/offers, /api/flights/recent-searches | flights, vendor_listings | user | In progress |
| Flight Booking | /passengers, /seats, /review, /payment, /confirmation | Traveller info, seat map, review, payment | /api/bookings/flight, /api/flight-bookings | bookings, flight_bookings, flights | user | In progress |
| Wallet | /dashboard/wallet | Balance, add money, transactions | /api/wallet, /api/wallet/add-money | wallet_transactions | user | In progress |
| My Bookings | /dashboard/my-bookings | Booking history, cancel, QR | /api/bookings, /api/my-bookings, /api/bookings/:id/cancel | bookings, refunds, wallet_transactions | user | In progress |
| Vendor Dashboard | /vendor-dashboard, /vendor/* | Stats, listings, bookings, customers, settlements | /api/vendor/dashboard-stats, /api/vendor/bookings, /api/vendor/customers, /api/vendor/settlements | bookings, users, payment_details | vendor, admin | In progress |
| Vendor Movie Operations | VendorDashboard movie modules, /add-movie | Movie CRUD, theatres, screens, shows, pricing, refunds, payouts, staff, notifications | /api/vendor/movies, /api/vendor/theatres, /api/vendor/screens, /api/vendor/shows, /api/vendor/pricing, /api/vendor/refunds, /api/vendor/payouts, /api/vendor/staff, /api/vendor/notifications | movies, theatres, screens, shows, movie_pricing, refunds, payouts, vendor_staff, notifications | vendor, admin | In progress |
| Vendor Flight Operations | /add-flight, FlightModule | Flight CRUD, seat blocks, passengers, revenue | /api/vendor/flights, /api/vendor/flights/:id/seats, /api/vendor/flight-bookings, /api/vendor/passengers, /api/vendor/flight-revenue | flights, flight_bookings | vendor, admin | In progress |
| Generic Vendor Listings | AddHotel, AddEvent, AddBus, AddTravelPackage, VendorModuleForm | Non-movie/flight listing forms | /api/vendor-listings | vendor_listings, app_records | vendor, admin | Early |
| Admin Dashboard | /admin-dashboard | Stats, users, vendors, bookings | /api/admin/stats, /api/admin/users, /api/admin/vendors, /api/admin/bookings | users, bookings | admin | Early |
| Real-time Seats | SeatSelection, VendorDashboard | Socket.IO joinShow, vendor rooms, seatUpdated events | /api/seats/:showId, /api/seats/block, /api/seats/unblock | movie_seats, seats | user, vendor | Mostly complete |
| Deployment / DevOps | backend Dockerfile, npm scripts | Build, run, health check | /api/health | all | admin/dev | Pending hardening |

## Dependencies, Integrations, and Ownership Map

| Category | Current Project Item | Details | Owner | Status | Risk |
|---|---|---|---|---|---|
| Frontend Framework | React 19, Vite, React Router | App routes in frontend/src/App.jsx with protected dashboard/vendor/admin routes | Frontend | Active | Low |
| API Client | fetch, axios | Mixed direct localhost calls and apiBase usage across pages | Frontend | Needs normalization | Medium |
| Icons/UI | lucide-react, react-icons | Used in vendor/user dashboard surfaces | Frontend | Active | Low |
| QR | qrcode.react, jsQR, BarcodeDetector fallback | QR display and scanner fallback for movie tickets | Full Stack | Mostly complete | Medium |
| Realtime | socket.io, socket.io-client | joinShow, joinVendor, seatUpdated flows | Full Stack | Mostly complete | Medium |
| Backend Framework | Express 5 | Mounted APIs in backend/server.js | Backend | Active | Low |
| Auth | JWT, bcryptjs | User/vendor/admin role auth | Backend | In progress | Medium |
| Database | MySQL via mysql2/promise | Schema bootstrapped in backend/src/config/db.js and migration SQL | Backend/DBA | Active | Medium |
| Payments | Mock payment endpoints | /api/payments/create-order and /api/payments/verify | Backend/Product | Early | High |
| Deployment | Dockerfile, npm scripts | Local-ready, production pipeline not finalized | DevOps | Pending | High |

## Roadmap Baseline

| Task ID | Project | Page | Module | Submodule | Task Description | Frontend Work | Backend Work | Database Work | API Work | Testing Work | Priority | Estimated Hours | Start Date | Target Date | Dependencies | Risk Level | Current Status | Completion % | Owner | Expected Output |
|---|---|---|---|---|---|---|---|---|---|---|---|---:|---|---|---|---|---|---:|---|---|
| TH-001 | TixHub | All | Audit | Project inventory | Freeze route, API, DB, and module inventory | Review routes/pages | Review controllers/routes | Review schema init/migration | Map endpoints | Manual smoke checklist | High | 4 | 2026-06-23 | 2026-06-23 | None | Low | Done | 100 | Codex | Management pack baseline |
| TH-002 | TixHub | /dashboard/movies | Movies | Listing/detail | Stabilize movie discovery and detail data fallbacks | Validate listing/detail UI | Normalize movie payload | Verify movies columns | GET /movies, /movies/:id | Browser smoke | High | 6 | 2026-06-23 | 2026-06-24 | TH-001 | Medium | In Progress | 70 | Frontend+Backend | Reliable movie browse |
| TH-003 | TixHub | /dashboard/movies/:id/seats | Movies | Seat sync | Verify live seat updates end-to-end | Check user seat map | Verify Socket.IO seat emit | Confirm movie_seats/seats source | GET/PATCH seats | Multi-browser/manual | High | 5 | 2026-06-23 | 2026-06-24 | TH-002 | Medium | Mostly Complete | 85 | Full Stack | No-refresh seat sync |
| TH-004 | TixHub | /dashboard/movies/:id/payment | Movies | Payment | Complete payment status consistency | Payment UX states | Booking/payment handlers | booking payment_status alignment | /payments/create-order, /payments/verify, /bookings/movie | Success/failure cases | High | 6 | 2026-06-24 | 2026-06-25 | TH-003 | High | In Progress | 60 | Full Stack | Confirmed paid movie booking |
| TH-005 | TixHub | /dashboard/my-bookings | Tickets | QR | Confirm QR generation and scanner compatibility | QR display and fallback UI | Verify token rules/check-in | qr_token, qr_scans | /vendor/qr/*, /vendor/ticket-scans | Camera/fallback manual | High | 4 | 2026-06-24 | 2026-06-25 | TH-004 | Medium | Mostly Complete | 85 | Full Stack | Working ticket validation |
| TH-006 | TixHub | /dashboard/flights | Flights | Search/detail | Harden flight search and details | Filters/detail fallbacks | Flight mappings | flights/vendor_listings | /flights, /flights/:id | Search scenarios | High | 5 | 2026-06-25 | 2026-06-26 | TH-001 | Medium | In Progress | 65 | Full Stack | Reliable flight discovery |
| TH-007 | TixHub | /dashboard/flights/:id/seats | Flights | Seat map | Verify aircraft-aware seat map and block states | Seat map states | Flight seat persistence | flights.seats JSON | /vendor/flights/:id/seats | Seat booking/block tests | High | 6 | 2026-06-26 | 2026-06-27 | TH-006 | High | In Progress | 55 | Full Stack | Accurate flight seat selection |
| TH-008 | TixHub | /dashboard/flights/:id/payment | Flights | Booking/payment | Finish flight booking confirmation and PNR | Payment/confirmation UI | Booking creation | bookings, flight_bookings | /bookings/flight, /flight-bookings | PNR/payment smoke | High | 6 | 2026-06-27 | 2026-06-29 | TH-007 | High | In Progress | 55 | Full Stack | Confirmed flight booking |
| TH-009 | TixHub | /vendor-dashboard | Vendor | Movie ops | QA movie production modules | Dashboard module polish | Verify controller actions | theatres, screens, shows, pricing | vendor movie ops APIs | CRUD/manual | High | 8 | 2026-06-29 | 2026-07-01 | TH-005 | Medium | In Progress | 75 | Full Stack | Vendor movie operations stable |
| TH-010 | TixHub | /add-flight | Vendor | Flight ops | Complete vendor flight management | Add/edit UI validation | Flight controller validation | flights | /vendor/flights CRUD | CRUD/manual | High | 7 | 2026-07-01 | 2026-07-02 | TH-008 | Medium | In Progress | 60 | Full Stack | Vendor flight CRUD stable |
| TH-011 | TixHub | /dashboard/wallet | Wallet | Balance | Validate wallet transaction flow | UX states | Transaction writes | wallet_transactions | /wallet, /wallet/add-money | Add/cancel/refund cases | Medium | 4 | 2026-07-02 | 2026-07-03 | TH-004 | Medium | In Progress | 60 | Full Stack | Wallet balances correct |
| TH-012 | TixHub | /admin-dashboard | Admin | Control panel | Expand admin CRUD and dashboards | Admin UX | Admin route rules | users, bookings | /api/admin/* | Role/manual tests | Medium | 8 | 2026-07-03 | 2026-07-06 | Auth stable | Medium | Early | 35 | Full Stack | Admin panel usable |
| TH-013 | TixHub | AddHotel/AddEvent/AddBus/AddTravelPackage | Vendor | Other modules | Normalize non-flight/movie listing forms | Form validation | Listing controller | vendor_listings/app_records | /vendor-listings | Form/manual | Medium | 10 | 2026-07-06 | 2026-07-10 | Vendor auth | Medium | Early | 30 | Full Stack | All listing modules functional |
| TH-014 | TixHub | All | QA | Regression | Add regression checklist and targeted tests | Build checks | node --check | Seed/test data | API smoke | Manual + automated | High | 12 | 2026-07-10 | 2026-07-17 | Feature freeze | High | Pending | 10 | QA | Release test pack |
| TH-015 | TixHub | All | DevOps | Release | Prepare deployment readiness | Env build | Health/start scripts | Migration order | Smoke endpoints | Deployment test | High | 10 | 2026-07-17 | 2026-07-24 | TH-014 | High | Pending | 15 | DevOps | Deployable release |
| TH-016 | TixHub | All | Hardening | Security/performance | Auth, secrets, CORS, validation, perf pass | Error states | Middleware/security | Index review | Rate/error handling | Security smoke | High | 16 | 2026-07-24 | 2026-08-07 | TH-015 | High | Pending | 10 | Engineering | Hardened beta |
| TH-017 | TixHub | All | UAT | Business acceptance | Vendor/user/admin UAT cycles | Fix UX bugs | Fix API bugs | Data corrections | Regression | UAT scripts | High | 24 | 2026-08-07 | 2026-08-28 | TH-016 | High | Pending | 0 | Product+QA | UAT signoff |
| TH-018 | TixHub | All | Production | Launch | Production cutover and monitoring | Final build | Runtime config | Backup/migration | Health checks | Launch checklist | High | 20 | 2026-08-28 | 2026-09-18 | UAT signoff | High | Pending | 0 | DevOps | Production launch |
| TH-019 | TixHub | project-management/TixHub_Project_Management_GoogleSheets.md | Project Controls | Continuous planning | Maintain Google Sheets pack and progress tracking | Keep copy-ready tracker tables current | Track API/backend status changes | Track schema readiness | Track endpoint readiness | Verify updates against code changes | High | 2 | 2026-06-23 | 2026-06-23 | TH-001 | Low | Done | 100 | Codex | Updated management system |

## Roadmap Timeline Buckets

| Timeline Bucket | Task ID | Project | Page | Module | Submodule | Task Description | Frontend Work | Backend Work | Database Work | API Work | Testing Work | Priority | Estimated Hours | Start Date | Target Date | Dependencies | Risk Level | Current Status | Completion % | Owner | Expected Output |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---:|---|---|---|---|---|---:|---|---|
| Today - 2026-06-23 | TH-019 | TixHub | project-management/TixHub_Project_Management_GoogleSheets.md | Project Controls | Continuous planning | Update roadmap and Google Sheets pack without resetting baseline | Add timeline buckets and governance rows | Confirm backend/API tracker alignment | Confirm DB tracker alignment | Map visible endpoints | Document pending verification | High | 2 | 2026-06-23 | 2026-06-23 | TH-001 | Low | Done | 100 | Codex | Current management pack ready |
| Today - 2026-06-23 | TH-002 | TixHub | /dashboard/movies | Movies | Listing/detail | Stabilize movie discovery and detail data fallbacks | Validate movie cards/details and image fallbacks | Normalize movie response fields | Verify movies schema columns | GET /movies, GET /movies/:id | Browser smoke | High | 6 | 2026-06-23 | 2026-06-24 | TH-001 | Medium | In Progress | 70 | Full Stack | Reliable movie browse |
| Today - 2026-06-23 | TH-003 | TixHub | /dashboard/movies/:id/seats | Movies | Seat sync | Verify live seat updates end-to-end | Check user seat map refresh behavior | Verify Socket.IO emit path | Confirm movie_seats/seats source | GET /seats/:showId, PATCH block/unblock | Multi-session manual | High | 5 | 2026-06-23 | 2026-06-24 | TH-002 | Medium | Mostly Complete | 85 | Full Stack | No-refresh seat sync |
| Tomorrow - 2026-06-24 | TH-004 | TixHub | /dashboard/movies/:id/payment | Movies | Payment | Complete movie payment status consistency | Payment UI success/failure states | Booking/payment status mapping | bookings payment_status and booking_status | /payments/create-order, /payments/verify, /bookings/movie | Success/failure booking test | High | 6 | 2026-06-24 | 2026-06-25 | TH-003 | High | In Progress | 60 | Full Stack | Confirmed paid movie booking |
| Tomorrow - 2026-06-24 | TH-005 | TixHub | /dashboard/my-bookings | Tickets | QR | Confirm QR generation and scanner compatibility | QR display and fallback scanner review | Verify token validation/check-in rules | qr_token and qr_scans | /vendor/qr/*, /vendor/ticket-scans | Camera/fallback manual | High | 4 | 2026-06-24 | 2026-06-25 | TH-004 | Medium | Mostly Complete | 85 | Full Stack | Working ticket validation |
| Day After Tomorrow - 2026-06-25 | TH-006 | TixHub | /dashboard/flights | Flights | Search/detail | Harden flight search and details | Filter and details fallbacks | Normalize flight mappers | flights and vendor_listings | /flights, /flights/:id | Search scenario smoke | High | 5 | 2026-06-25 | 2026-06-26 | TH-001 | Medium | In Progress | 65 | Full Stack | Reliable flight discovery |
| Next 7 Days | TH-007 | TixHub | /dashboard/flights/:id/seats | Flights | Seat map | Verify aircraft-aware seat map and block states | Seat map status UX | Flight seat persistence | flights.seats JSON | /vendor/flights/:id/seats | Seat booking/block smoke | High | 6 | 2026-06-26 | 2026-06-27 | TH-006 | High | In Progress | 55 | Full Stack | Accurate flight seat selection |
| Next 7 Days | TH-008 | TixHub | /dashboard/flights/:id/payment | Flights | Booking/payment | Finish flight booking confirmation and PNR | Payment/confirmation UI | Booking creation and PNR | bookings, flight_bookings | /bookings/flight, /flight-bookings | PNR/payment smoke | High | 6 | 2026-06-27 | 2026-06-29 | TH-007 | High | In Progress | 55 | Full Stack | Confirmed flight booking |
| Next 7 Days | TH-009 | TixHub | /vendor-dashboard | Vendor | Movie ops | QA movie production modules | Dashboard module polish | Controller action verification | theatres, screens, shows, pricing | vendor movie ops APIs | CRUD/manual | High | 8 | 2026-06-29 | 2026-07-01 | TH-005 | Medium | In Progress | 75 | Full Stack | Vendor movie operations stable |
| Week 1 | TH-002 to TH-009 | TixHub | Dashboard booking pages | User booking | Stabilization | Movie browse, movie seats, payment, QR, flight start | Fix UI/data gaps | Fix API/data gaps | Validate core schemas | Smoke core APIs | Manual smoke | High | 40 | 2026-06-23 | 2026-06-29 | Existing code | High | In Progress | 45 | Full Stack | Stable booking core |
| Week 2 | TH-010 to TH-012 | TixHub | VendorDashboard, AddFlight, AdminDashboard | Vendor/Admin | Operations | Vendor flight CRUD, wallet validation, admin hardening | Form/dashboard polish | Controller and role hardening | flights, wallet, users/bookings | vendor/admin APIs | CRUD and role checks | High | 38 | 2026-07-01 | 2026-07-06 | Week 1 | Medium | Pending | 25 | Full Stack | Stable vendor/admin basics |
| Week 3 | TH-013 | TixHub | AddHotel/AddEvent/AddBus/AddTravelPackage | Vendor | Other modules | Normalize non-flight/movie listing forms | Form validation | Listing controller cleanup | vendor_listings/app_records | /vendor-listings | Form/manual | Medium | 36 | 2026-07-06 | 2026-07-13 | Vendor auth | Medium | Pending | 15 | Full Stack | All listing modules functional |
| Week 4 | TH-014 and TH-015 | TixHub | All | QA/DevOps | Release prep | Regression, smoke tests, deployment readiness | Build verification | node --check and health verification | Migration readiness | API smoke | Manual and targeted tests | High | 42 | 2026-07-10 | 2026-07-24 | Feature freeze | High | Pending | 10 | QA+DevOps | Deployable release candidate |
| Month 2 | TH-016 and TH-017 | TixHub | All | Hardening/UAT | Beta | Security/performance hardening and UAT | UX fixes | Middleware/API fixes | Index/data corrections | Regression APIs | UAT scripts | High | 80 | 2026-07-24 | 2026-08-28 | Release candidate | High | Pending | 0 | Engineering+Product | UAT signoff |
| Month 3 | TH-018 | TixHub | All | Production | Launch | Production cutover and monitoring | Final build | Runtime config | Backup/migration | Health checks | Launch checklist | High | 60 | 2026-08-28 | 2026-09-18 | UAT signoff | High | Pending | 0 | DevOps | Production launch |

## Continuous Progress Update Rules

| Trigger | Update Action | Sheets To Update | Status Movement Rule | Owner |
|---|---|---|---|---|
| New work completed | Add a Daily_Updates row and increase task completion % | Daily_Updates, Daily_Task_Planner, Sprint_Tracker, Feature_Tracker, Team_Productivity | Move task to Done only after code change plus verification is recorded | Scrum Master |
| Bug found | Add BUG row and link to feature/task in remarks | Bug_Tracker, Risks_And_Blockers, Sprint_Tracker | Keep sprint Yellow/Red until critical/high bugs are closed | QA Lead |
| API added/changed | Add or update endpoint row | API_Tracker, Backend_Tracker, Feature_Tracker | Mark Integrated only when frontend or test client consumes it | Backend Lead |
| Schema changed | Add table/relationship/index migration status | Database_Tracker, Risks_And_Blockers | Mark migration complete only after local DB applies cleanly | DBA/Backend |
| Release test passed | Update testing and release readiness | Testing_Tracker, Deployment_Tracker, Release Report | Ready For Deployment stays NO until critical testing/security/deployment are green | DevOps Lead |

## Sheet 1: Projects_Master

| Project Name | Owner | Start Date | Target Date | Current Sprint | Overall Progress % | Frontend % | Backend % | Database % | Testing % | Deployment % | Current Status | Health Status | Expected Completion |
|---|---|---|---|---|---:|---:|---:|---:|---:|---:|---|---|---|
| TixHub Booking Platform | Product/Engineering | 2026-06-23 | 2026-09-18 | Sprint 1 - Stabilization | 62 | 68 | 66 | 72 | 28 | 15 | Active Development | Yellow | 2026-09-18 |

## Sheet 2: Daily_Updates

| Date | Developer | Project | Sprint | Page | Module | Submodule | Task ID | Task Description | Frontend Status | Backend Status | Database Status | API Status | Testing Status | Priority | Estimated Hours | Actual Hours | Completion % | Current Status | Blockers | Start Date | Target Date | Remarks |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---:|---:|---:|---|---|---|---|---|
| 2026-06-23 | Codex | TixHub | Sprint 1 | All | Audit | Project inventory | TH-001 | Create project management baseline | Done | Done | Done | Done | Manual only | High | 4 | 4 | 100 | Done | None | 2026-06-23 | 2026-06-23 | Baseline created from current files |
| 2026-06-23 | Codex | TixHub | Sprint 1 | project-management/TixHub_Project_Management_GoogleSheets.md | Project Controls | Continuous planning | TH-019 | Update roadmap with timeline buckets and continuous update rules | Done | Done | Done | Done | Manual document review | High | 2 | 2 | 100 | Done | None | 2026-06-23 | 2026-06-23 | Existing roadmap updated, not reset |
| 2026-06-23 | Full Stack | TixHub | Sprint 1 | /dashboard/movies | Movies | Listing/detail | TH-002 | Stabilize movie discovery and detail data | In Progress | In Progress | In Progress | In Progress | Pending | High | 6 | 0 | 70 | In Progress | Needs browser smoke | 2026-06-23 | 2026-06-24 | Preserve current dashboard UI |
| 2026-06-23 | Full Stack | TixHub | Sprint 1 | /dashboard/movies/:id/seats | Seats | Live sync | TH-003 | Verify user/vendor no-refresh seat updates | Mostly Complete | Mostly Complete | Mostly Complete | Mostly Complete | Pending | High | 5 | 0 | 85 | In Progress | Needs multi-session verification | 2026-06-23 | 2026-06-24 | Socket.IO already present |

## Sheet 3: Daily_Task_Planner

| Task ID | Today's Tasks | Tomorrow Tasks | Day After Tomorrow Tasks | Estimated Hours | Priority | Dependencies | Status |
|---|---|---|---|---:|---|---|---|
| TH-001 | Finalize management baseline | Update after completed code work | Update sprint progress | 4 | High | None | Done |
| TH-019 | Update management pack with timeline buckets | Use updated tracker for tomorrow planning | Carry forward progress without reset | 2 | High | TH-001 | Done |
| TH-002 | Audit movie listing/detail data gaps | Patch fallbacks and route issues | Regression test movie browse | 6 | High | TH-001 | In Progress |
| TH-003 | Verify live seat sync assumptions | Multi-session user/vendor test | Fix any seat conflict bugs | 5 | High | TH-002 | In Progress |
| TH-004 | Review movie payment status rules | Patch payment/booking status consistency | Confirm QR only for success+confirmed | 6 | High | TH-003 | Pending |
| TH-006 | Prepare flight search test cases | Start flight data cleanup | Flight details smoke | 5 | High | TH-001 | Pending |

## Sheet 4: Weekly_Roadmap

| Week Number | Feature | Page | Module | Owner | Planned Hours | Actual Hours | Dependencies | Target Date | Completion % | Status | Remarks |
|---|---|---|---|---|---:|---:|---|---|---:|---|---|
| Week 1 | Movie/flight/user booking stabilization | Dashboard booking pages | User booking | Full Stack | 40 | 4 | Existing routes/APIs | 2026-06-29 | 45 | In Progress | Focus on payment, seats, QR |
| Week 2 | Vendor movie and flight operations | VendorDashboard, AddFlight | Vendor ops | Full Stack | 38 | 0 | Week 1 | 2026-07-06 | 25 | Pending | CRUD, settlements, scanners |
| Week 3 | Other vendor modules and admin | AddHotel, AddEvent, AdminDashboard | Admin/vendor listings | Full Stack | 36 | 0 | Week 2 | 2026-07-13 | 15 | Pending | Normalize generic listings |
| Week 4 | QA, bugs, release readiness | All | QA/DevOps | QA+DevOps | 42 | 0 | Feature freeze | 2026-07-24 | 10 | Pending | Build, smoke, security |
| Month 2 | Hardening and UAT | All | Security, performance, UAT | Engineering+Product | 80 | 0 | Week 4 | 2026-08-28 | 0 | Pending | Beta acceptance |
| Month 3 | Production launch | All | Deployment | DevOps | 60 | 0 | UAT signoff | 2026-09-18 | 0 | Pending | Cutover and monitoring |

## Sheet 5: Sprint_Tracker

| Sprint | Features | Completed | In Progress | Pending | Bugs | Testing Status | Release Readiness | Health Status |
|---|---|---|---|---|---:|---|---|---|
| Sprint 1 - Stabilization | Audit, roadmap controls, movie browse, movie seats, movie payment, QR | TH-001, TH-019 | TH-002, TH-003 | TH-004, TH-005 | 0 logged | Manual pending | Not ready | Yellow |
| Sprint 2 - Flights/Vendor | Flight booking, vendor movie ops, vendor flight ops | None | None | TH-006, TH-007, TH-008, TH-009, TH-010 | 0 logged | Pending | Not ready | Yellow |
| Sprint 3 - Admin/Modules | Wallet, admin, other listings | None | None | TH-011, TH-012, TH-013 | 0 logged | Pending | Not ready | Yellow |
| Sprint 4 - Release | Regression, DevOps, hardening | None | None | TH-014, TH-015, TH-016 | 0 logged | Pending | Not ready | Red |

## Sheet 6: Feature_Tracker

| Feature | Frontend | Backend | Database | API | Testing | Deployment | Overall Status | Completion % |
|---|---|---|---|---|---|---|---|---:|
| Auth and roles | In Progress | In Progress | In Progress | In Progress | Pending | Pending | In Progress | 70 |
| User dashboard shell | In Progress | In Progress | N/A | In Progress | Pending | Pending | In Progress | 70 |
| Movie discovery | In Progress | In Progress | In Progress | In Progress | Pending | Pending | In Progress | 70 |
| Movie booking/payment | In Progress | In Progress | In Progress | In Progress | Pending | Pending | In Progress | 60 |
| QR ticketing/scanner | Mostly Complete | Mostly Complete | Mostly Complete | Mostly Complete | Pending | Pending | Mostly Complete | 85 |
| Live movie seats | Mostly Complete | Mostly Complete | Mostly Complete | Mostly Complete | Pending | Pending | Mostly Complete | 85 |
| Flight search/details | In Progress | In Progress | In Progress | In Progress | Pending | Pending | In Progress | 65 |
| Flight booking/payment | In Progress | In Progress | In Progress | In Progress | Pending | Pending | In Progress | 55 |
| Wallet | In Progress | In Progress | In Progress | In Progress | Pending | Pending | In Progress | 60 |
| Vendor movie operations | In Progress | In Progress | In Progress | In Progress | Pending | Pending | In Progress | 75 |
| Vendor flight operations | In Progress | In Progress | In Progress | In Progress | Pending | Pending | In Progress | 60 |
| Admin dashboard | Early | Early | In Progress | Early | Pending | Pending | Early | 35 |
| Other vendor listings | Early | Early | Early | Early | Pending | Pending | Early | 30 |
| DevOps/release | Pending | Pending | Pending | Pending | Pending | Pending | Pending | 15 |

## Sheet 7: Frontend_Tracker

| Page | Module | Components | Framework | Status | Completion % |
|---|---|---|---|---|---:|
| / | Auth | Login.jsx | React 19, React Router | In Progress | 75 |
| /register | Auth | Register.jsx | React 19 | In Progress | 75 |
| /dashboard | Dashboard | DashboardLayout.jsx, Dashboard.jsx, Sidebar/Header | React Router | In Progress | 70 |
| /dashboard/movies | Movies | MovieContent.jsx, MoviesContent.jsx | React, axios | In Progress | 70 |
| /dashboard/movies/:id | Movies | MovieDetails.jsx, TheatreShows.jsx | React, axios | In Progress | 70 |
| /dashboard/movies/:id/seats | Movie seats | SeatSelection.jsx | React, Socket.IO client | Mostly Complete | 85 |
| /dashboard/movies/:id/payment | Movie payment | MoviePayment.jsx | React fetch | In Progress | 60 |
| /dashboard/flights | Flights | FlightContent.jsx | React, axios | In Progress | 65 |
| /dashboard/flights/:id/* | Flight booking | FlightDetails, TravellerSelection, SeatSelection, Review, Payment | React | In Progress | 60 |
| /dashboard/my-bookings | Bookings | MyBookings.jsx | React, qrcode.react, jsQR | Mostly Complete | 85 |
| /dashboard/wallet | Wallet | TixWallet.jsx | React | In Progress | 60 |
| /vendor-dashboard | Vendor | VendorDashboard.jsx | React, axios, Socket.IO | In Progress | 75 |
| /add-movie | Vendor movie | AddMovie.jsx | React, axios | In Progress | 70 |
| /add-flight | Vendor flight | AddFlight.jsx, FlightModule.jsx | React, axios | In Progress | 60 |
| /add-hotel, /add-event, /add-bus, /add-travel-package | Vendor listings | AddHotel, AddEvent, AddBus, AddTravelPackage | React | Early | 30 |
| /admin-dashboard | Admin | AdminDashboard.jsx | React | Early | 35 |

## Sheet 8: Backend_Tracker

| Service | Controller | Business Logic | Middleware | Authentication | Status | Completion % |
|---|---|---|---|---|---|---:|
| Auth | auth.js | Register/login/reset/me/logout | authMiddleware.js | JWT | In Progress | 75 |
| Movies | movieRoutes.js | Movie CRUD, reviews | requireAuth, requireRole | JWT role checks | In Progress | 70 |
| Bookings | bookingRoutes.js | Movie/flight booking, cancel, QR token | requireAuth | JWT | In Progress | 65 |
| Flights | flightRoutes.js, flightController.js | Search, CRUD, booking | requireAuth, requireRole | JWT | In Progress | 60 |
| Seats | seatRoutes.js, movieSeatService.js | Seat init/block/unblock/book, socket emit | requireAuth, requireRole | JWT | Mostly Complete | 85 |
| Vendor listings | vendorListingRoutes.js, vendorListingController.js | Vendor CRUD, reports, payment details | requireAuth implicit in controller | JWT | In Progress | 65 |
| Vendor operations | vendorOperationsRoutes.js, vendorOperationsController.js | QR scanner, theatres, screens, shows, pricing, refunds, payouts, staff | async wrapper | JWT expected | In Progress | 75 |
| Wallet | walletRoutes.js | Balance/add money | requireAuth | JWT | In Progress | 60 |
| Admin | adminRoutes.js | Stats, users, vendors, bookings | Not fully hardened | Needs role hardening | Early | 35 |
| Payments | paymentRoutes.js | Mock order and verify | requireAuth | JWT | Early | 40 |
| Socket | socket.js/server.js | joinShow, joinVendor, emit updates | N/A | Room-based | Mostly Complete | 80 |

## Sheet 9: Database_Tracker

| Table | Relationships | Indexes | Migration | Seed Data | Completion % |
|---|---|---|---|---|---:|
| users | bookings.user_id, vendor ownership | email unique | db.js auto-create | Not formalized | 75 |
| movies | vendor_id, shows, bookings, reviews | vendor_id, status | db.js auto-create | migrated from app_records | 75 |
| flights | vendor_id, flight_bookings | vendor_id, status, route | db.js auto-create | static fallback + DB | 70 |
| bookings | user_id, vendor_id, movie_id, show_id, flight_id | user_id, vendor_id, module, qr_token | db.js + migration | Runtime | 70 |
| flight_bookings | booking_id, flight_id, user_id | user_id, flight_id | db.js auto-create | Runtime | 60 |
| movie_seats | show_id, movie_id, booking_id | show_id, movie_id, status | db.js auto-create | generated | 85 |
| seats | show_id, movie_id, theatre_id, screen_id | show_id, status | db.js + migration | generated | 80 |
| theatres | vendor_id | vendor_id | db.js + migration | Runtime | 70 |
| screens | theatre_id, vendor_id | theatre_id, vendor_id | db.js + migration | Runtime | 70 |
| shows | movie_id, theatre_id, screen_id, vendor_id | movie_id, vendor_id | db.js + migration | Runtime | 70 |
| qr_scans | booking_id, vendor_id | booking_id, vendor_id, qr_token | db.js + migration | Runtime | 85 |
| movie_pricing | vendor_id, movie_id, show_id | vendor_id, show_id | db.js + migration | Runtime | 70 |
| refunds | booking_id, user_id, vendor_id | booking_id, vendor_id | db.js + migration | Runtime | 55 |
| payouts | vendor_id | vendor_id | db.js + migration | Runtime | 55 |
| vendor_staff | vendor_id | vendor_id | db.js + migration | Runtime | 60 |
| notifications | vendor_id | vendor_id | db.js + migration | Runtime | 60 |
| movie_reviews | movie_id, booking_id, user_id, vendor_id | movie_id, vendor_id | db.js + migration | Runtime | 65 |
| movie_status_logs | movie_id, vendor_id | movie_id | db.js + migration | Runtime | 60 |
| app_records | legacy model store | model | db.js auto-create | Existing | 50 |

## Sheet 10: API_Tracker

| API Name | Endpoint | Method | Integrated | Testing Status | Completion % |
|---|---|---|---|---|---:|
| Health | /api/health | GET | Yes | Smoke pending | 80 |
| Login | /api/auth/login | POST | Yes | Manual pending | 75 |
| Register | /api/auth/register | POST | Yes | Manual pending | 75 |
| Current User | /api/auth/me | GET | Partial | Pending | 65 |
| Movies | /api/movies | GET | Yes | Pending | 75 |
| Movie Detail | /api/movies/:id | GET | Yes | Pending | 75 |
| Movie Review | /api/movies/:id/reviews | POST | Partial | Pending | 60 |
| Add Movie | /api/add-movie, /api/vendor/movies | POST | Yes | Pending | 70 |
| Seats | /api/seats/:showId | GET | Yes | Pending | 85 |
| Block Seat | /api/seats/block | PATCH | Yes | Pending | 85 |
| Unblock Seat | /api/seats/unblock | PATCH | Yes | Pending | 85 |
| Movie Booking | /api/bookings/movie | POST | Yes | Pending | 70 |
| Flight Booking | /api/bookings/flight | POST | Yes | Pending | 60 |
| My Bookings | /api/bookings | GET | Yes | Pending | 70 |
| Cancel Booking | /api/bookings/:id/cancel | PATCH | Yes | Pending | 60 |
| Flights | /api/flights | GET | Yes | Pending | 70 |
| Flight Detail | /api/flights/:id | GET | Yes | Pending | 70 |
| Flight CRUD | /api/vendor/flights | GET/POST/PUT/DELETE | Yes | Pending | 60 |
| Wallet | /api/wallet | GET | Yes | Pending | 60 |
| Add Money | /api/wallet/add-money | POST | Yes | Pending | 60 |
| Payment Order | /api/payments/create-order | POST | Yes | Pending | 45 |
| Payment Verify | /api/payments/verify | POST | Yes | Pending | 45 |
| QR Verify | /api/vendor/qr/verify | GET/POST | Yes | Pending | 85 |
| QR Check-in | /api/vendor/qr/check-in | POST | Yes | Pending | 85 |
| Ticket Scans | /api/vendor/ticket-scans | GET/POST | Yes | Pending | 85 |
| Vendor Dashboard | /api/vendor/dashboard-stats | GET | Yes | Pending | 65 |
| Vendor Payment Details | /api/vendor/payment-details | GET/POST/PUT | Yes | Pending | 65 |
| Admin Stats | /api/admin/stats | GET | Yes | Pending | 35 |

## Sheet 11: Bug_Tracker

| Bug ID | Module | Severity | Assigned To | ETA | Status |
|---|---|---|---|---|---|
| BUG-001 | Frontend API config | Medium | Frontend | 2026-06-26 | Open |
| BUG-002 | Duplicate frontend component paths | Medium | Frontend | 2026-06-27 | Open |
| BUG-003 | Payment provider is mocked | High | Backend | 2026-07-05 | Open |
| BUG-004 | Admin route hardening incomplete | High | Backend | 2026-07-06 | Open |
| BUG-005 | Formal automated tests missing | High | QA | 2026-07-17 | Open |

## Sheet 12: Testing_Tracker

| Feature | Unit Test | Integration Test | Manual Test | UAT | Status |
|---|---|---|---|---|---|
| Auth | Pending | Pending | Pending | Pending | Not Started |
| Movie discovery | Pending | Pending | Pending | Pending | Not Started |
| Movie booking/payment | Pending | Pending | Pending | Pending | Not Started |
| QR scanner/check-in | Pending | Pending | Pending | Pending | Not Started |
| Live seats | Pending | Pending | Pending | Pending | Not Started |
| Flight booking | Pending | Pending | Pending | Pending | Not Started |
| Vendor movie ops | Pending | Pending | Pending | Pending | Not Started |
| Vendor flight ops | Pending | Pending | Pending | Pending | Not Started |
| Admin | Pending | Pending | Pending | Pending | Not Started |
| Deployment | Pending | Pending | Pending | Pending | Not Started |

## Sheet 13: Deployment_Tracker

| Environment | Frontend Version | Backend Version | Database Version | Status |
|---|---|---|---|---|
| Local | package 0.0.0 | package 1.0.0 | MySQL priyanka schema auto-init | Active |
| Development | TBD | TBD | TBD | Pending |
| Staging | TBD | TBD | TBD | Pending |
| Production | TBD | TBD | TBD | Pending |

## Sheet 14: Risks_And_Blockers

| Risk Type | Description | Severity | Owner | Mitigation Plan | Status |
|---|---|---|---|---|---|
| Technical | Mixed static fallback data and DB data can create inconsistent flight/movie results | High | Engineering | Normalize source of truth and document fallback policy | Open |
| Technical | Payment APIs are mock-level and not production provider-ready | High | Backend | Integrate provider or mark as sandbox-only | Open |
| Security | Hardcoded local DB credentials in db.js | High | DevOps | Move to environment variables and rotate secrets | Open |
| QA | Automated tests are missing | High | QA | Add targeted API smoke and frontend build regression | Open |
| Product | Other vendor modules are early and may not match business rules | Medium | Product | Define exact hotel/event/bus/package requirements | Open |
| DevOps | Deployment configuration and migration sequencing not finalized | High | DevOps | Create env docs, migration plan, health checks | Open |

## Sheet 15: Team_Productivity

| Developer | Tasks Completed | Hours Worked | Productivity Score | Remarks |
|---|---:|---:|---:|---|
| Codex | 2 | 6 | 92 | Created baseline and updated continuous roadmap controls |
| Frontend Developer | 0 | 0 | 0 | Update after daily work |
| Backend Developer | 0 | 0 | 0 | Update after daily work |
| QA Engineer | 0 | 0 | 0 | Testing not started |
| DevOps Engineer | 0 | 0 | 0 | Deployment hardening pending |

## Daily Report - 2026-06-23

| Metric | Value |
|---|---|
| Completed Tasks | TH-001 Project inventory and management baseline; TH-019 continuous roadmap and Google Sheets update |
| Tasks In Progress | TH-002 Movie discovery stabilization, TH-003 live movie seat verification |
| Pending Tasks | TH-004 payment status consistency, TH-005 QR validation retest, TH-006 flight search hardening |
| Blockers | Need browser/API smoke pass; production payment provider not integrated |
| Bug Fixes | None applied in this management pass |
| Hours Worked | 6 planned baseline/control hours |
| Today's Progress % | 100 for project controls, 45 for Sprint 1 |
| Overall Project % | 62 |
| Tomorrow's Deliverables | Movie browse cleanup, live seat multi-session verification, payment status review, update trackers after code verification |
| Health Status | Yellow |

## Weekly Report

| Report Area | Week 1 | Week 2 |
|---|---|---|
| Summary | Stabilize movie/flight booking basics and confirm live seats/QR | Vendor movie/flight operations and dashboards |
| Completed Features | Project baseline and continuous tracker controls | Pending |
| Pending Features | Payment consistency, browser testing, flight booking | Vendor CRUD, settlements, scanner regression |
| Delays | Formal tests not yet present | Dependent on Week 1 closure |
| Dependencies | Existing route/API stability | Stable booking/payment flows |
| Risks | Payment mock, API config drift, duplicate component paths | Vendor module scope creep |
| Testing Status | Pending | Pending |
| Overall Completion % | 62 | TBD |
| Expected Completion Date | 2026-09-18 | 2026-09-18 |
| Health Status | Yellow | Yellow |

## Release Report

| Release Area | Status |
|---|---|
| Frontend Completion % | 68 |
| Backend Completion % | 66 |
| Database Completion % | 72 |
| API Completion % | 65 |
| Testing Completion % | 28 |
| Deployment Completion % | 15 |
| Security Status | Needs hardening: env secrets, admin route role checks, CORS policy |
| Performance Optimization | Pending bundle/API profiling |
| CI/CD Status | Not established in visible project files |
| Known Issues | Mock payment, missing automated tests, duplicate frontend component tree, local DB credentials |
| Release Readiness % | 42 |
| Confidence Level % | 55 |
| Ready For Deployment | NO |
