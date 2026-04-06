# LMS Implementation Tasks

Source documents:
- `LMS_DRD.docx`
- `LMS_TaskAssignment_v1.1.docx`

Current repo baseline:
- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma + PostgreSQL
- Existing app shell under `src/app`

## 1. Scope Lock and Delivery Rules
- [x] Confirm in-scope modules: Profile, Salary, Leave, Admin Panel
- [x] Confirm out-of-scope module: Online Services
- [x] Freeze primary personas: Employee, Manager, HR Admin
- [x] Keep implementation aligned to this repo architecture, not a separate React Router + Express split
- [x] Define Definition of Done for every feature: UI, validation, persistence, role checks, loading/error states, responsive behavior, tests

## 2. App Architecture for This Repo
- [x] Define route structure in `src/app` for auth, dashboard, leave, profile, salary, and admin areas
- [x] Decide shared layout strategy for authenticated pages using nested layouts
- [x] Define where server components, client components, server actions, and route handlers will be used
- [ ] Create a data-access layer (e.g., repository/query/mutation methods) for Prisma queries and mutations rather than relying only on the Prisma client singleton
- [ ] Add validation schemas (use Zod or similar) for form and API boundaries and for shared domain types
- [x] Define status enums and role enums once and reuse them across UI and database code

## 3. Design System and DRD Foundations
- [x] Add DRD color, spacing, radius, shadow, and typography tokens to the app theme
- [x] Refactor global styles to use tokens instead of one-off values
- [x] Extend UI primitives for LMS needs: buttons, inputs, selects, textareas, badges, cards, tables, modals, breadcrumbs, stepper, toast
- [x] Build desktop sidebar and mobile navigation patterns described in the DRD
- [x] Add notification bell with unread count in the top header
- [x] Implement empty states, loading skeletons, and confirmation dialogs
- [x] Ensure components meet the DRD click target, hover, disabled, and focus behaviors

## 4. Database and Prisma Expansion
- [x] Replace the minimal schema with the full LMS schema required by the documents
- [x] Expand `User` model with profile, department, designation, payroll, and contact fields
- [x] Add models for `LeaveType`, `LeaveBalance`, `ApprovalLog`, `SalaryComponent`, `SalarySlip`, `Holiday`, and `RefreshToken`
- [x] Expand `LeaveRequest` with leave type, duty incharge, day time, computed days, comments, and audit fields
- [x] Add enums for role, leave status, approval action, and salary component type where appropriate
- [x] Create Prisma migrations for the full schema
- [x] Add seed data for leave types, holidays, and a default HR Admin account
- [x] Document required environment variables for Prisma/PostgreSQL

## 5. Authentication and Authorization
- [x] Build login page matching DRD requirements
- [x] Implement session strategy for Next.js app routes and protected pages
- [x] Add login, logout, refresh/session renewal, forgot-password, and reset-password flows
- [x] Guard authenticated routes by role: Employee, Manager, HR Admin
- [x] Add server-side authorization checks for all sensitive mutations and data reads
- [x] Handle expired sessions and redirect users cleanly back to sign-in

## 6. Employee Dashboard
- [x] Create employee dashboard route and page layout
- [x] Show welcome block with employee name and current date
- [x] Add leave balance summary cards by leave type
- [x] Add prominent Apply for Leave action
- [x] Add recent leave requests table with status badges
- [x] Add upcoming approved leaves mini-calendar widget
- [x] Add latest unread notifications panel

## 7. Leave Module - Employee Experience
- [x] Create leave apply route and page in `src/app`
- [x] Build 4-step leave application form with stepper
- [x] Add leave type selection with descriptions
- [x] Add date range selection with weekend and holiday exclusion
- [x] Add day-time handling for full day, forenoon, and afternoon requests
- [x] Compute number of days automatically and show live balance preview
- [x] Add duty incharge and reason validation
- [x] Add review-and-submit step with confirmation checkbox
- [x] Add leave history table with sorting and pagination
- [x] Add leave card page with total, used, remaining, and pending balances
- [x] Add approved/rejected/pending listing with cancel action for pending entries

## 8. Leave Module - Manager Experience
- [x] Create manager dashboard route and layout
- [x] Build pending approvals list with employee, leave type, dates, and day count
- [x] Add quick approve/reject actions
- [x] Add reject modal with mandatory comment support when needed by workflow
- [x] Build team leave calendar with color-coded leave blocks
- [x] Add filters for employee name, leave type, and date range
- [x] Add team conflict warning when 3 or more members overlap

## 9. HR Admin Experience
- [x] Create admin routes for user management, leave policy, holiday calendar, reports, and activity log
- [x] Build user management table with edit and deactivate actions
- [x] Build leave policy CRUD screens
- [x] Build holiday calendar CRUD or import flow
- [x] Build reports screen with date range and module filters
- [x] Add PDF and CSV export flows
- [x] Build system activity log with pagination and actor/timestamp details

## 10. Profile Module
- [ ] Build profile view page with all required employee fields from the task document
- [ ] Add avatar/initials summary card
- [ ] Build edit profile form with validation for email, PAN, and contact number
- [ ] Add document upload flow if still required by product scope
- [ ] Save profile updates through Prisma-backed actions or route handlers

## 11. Salary Module
- [ ] Build salary structure page with earnings and deductions breakdown
- [ ] Build salary slips list page by month and year
- [ ] Build salary slip detail or preview flow
- [ ] Add PDF generation/download for salary slips
- [ ] Build IT Form-16 and Provisional Form-16 pages with year selector
- [ ] Add Prisma models and queries to support salary records and downloads

## 12. Data Mutations and API Surface
- [ ] Decide which features use route handlers versus server actions
- [ ] Implement leave submission, cancellation, approval, and rejection mutations
- [ ] Implement balance lookup and leave history queries
- [ ] Implement profile read/update and document upload endpoints if needed
- [ ] Implement salary and report data endpoints or server actions
- [ ] Add structured validation and consistent error responses
- [ ] Add audit logging for admin and approval actions

## 13. Notifications and Background Work
- [ ] Add toast feedback for success and error states
- [ ] Design notification persistence model and unread/read behavior
- [ ] Trigger notifications on leave submission, approval, rejection, and cancellation
- [ ] Add email delivery flow if SMTP remains part of scope
- [ ] Add scheduled reminders for pending approvals and yearly leave resets if deployment model supports cron jobs

## 14. Testing and Quality
- [ ] Add unit tests for leave day calculation, overlap detection, and balance rules
- [ ] Add component tests for login, leave apply flow, and critical forms
- [ ] Add integration tests for auth, leave, profile, and admin flows
- [ ] Add accessibility checks for keyboard navigation and form labeling
- [ ] Add responsive QA pass for mobile, tablet, desktop, and wide layouts
- [ ] Define a realistic coverage target for this repo and enforce it in CI

## 15. DevOps and Documentation
- [ ] Add `.env.example` for database, auth, and email configuration
- [ ] Add local development instructions for Prisma and PostgreSQL
- [ ] Add CI workflow for lint, typecheck, test, and build
- [ ] Add seed/reset scripts for local development
- [ ] Update `README.md` with module scope, stack, and setup steps
- [ ] Add `CONTRIBUTING.md` with branch naming, PR rules, and commit format
- [ ] Document backup and deployment approach for PostgreSQL

## 16. Suggested Build Order
- [ ] Phase 1: Prisma schema, auth, layout shell, design tokens
- [ ] Phase 2: Employee dashboard and leave apply flow
- [ ] Phase 3: Manager approvals and admin basics
- [ ] Phase 4: Profile and salary modules
- [ ] Phase 5: notifications, exports, tests, docs, deployment hardening

## 17. DRD Compliance Checklist
- [ ] Primary actions should be completable in 3 clicks or fewer where practical
- [ ] Shared navigation, tokens, and components should remain consistent across pages
- [ ] All screens should work at mobile, tablet, desktop, and wide breakpoints
- [ ] WCAG 2.1 AA requirements should be validated before release
- [ ] Interactive feedback should appear quickly for submit, approve, reject, delete, and cancel actions
- [ ] Every role should see only the views and actions intended for that persona

## 18. Owner Mapping from Source Document
- [ ] M-1: App layout, auth UI, leave UI
- [ ] M-2: Profile UI, salary UI, responsive polish
- [ ] M-3: Auth, user data, Prisma schema, migrations, seeding
- [ ] M-4: Leave workflows, salary data, notifications, scheduled jobs
- [ ] M-5: Testing, CI/CD, docs, deployment
