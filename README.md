# LMS — Leave Management System

A full-stack Leave Management System built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, Prisma, and PostgreSQL.

## Module Scope

| Module | Status |
|--------|--------|
| Authentication (Login, Logout, Refresh) | ✅ Complete |
| Employee Dashboard | ✅ Complete |
| Leave Module (Apply, History, Balances) | ✅ Complete |
| Manager Approvals & Team Calendar | ✅ Complete |
| HR Admin (Users, Policy, Reports, Logs) | ✅ Complete |
| Profile Module | ✅ Complete |
| Salary Module | ✅ Complete |
| Notifications | 🔧 In Progress |

> **Out of scope:** Online Services module.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| UI Primitives | shadcn/ui + Base UI |
| ORM | Prisma 7 |
| Database | PostgreSQL 16 |
| Auth | JWT (jose) + Refresh Tokens |
| Validation | Zod |
| Email | Nodemailer (SMTP) |
| Testing | Jest + React Testing Library |

## Prerequisites

- Node.js ≥ 20.19
- PostgreSQL 16 running locally or via Docker
- npm

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/sujalmh/lms.git
cd lms
npm install
```

### 2. Configure environment

```cmd
copy .env.example .env
```

Open `.env` and fill in your `DATABASE_URL`, `JWT_SECRET`, and optionally SMTP settings.

### 3. Set up the database

```bash
# Generate Prisma client
npm run db:generate

# Run all migrations
npm run db:migrate

# Seed with default data
npm run db:seed
```

Default HR Admin credentials after seeding:
- **Email:** `admin@lms.local`
- **Password:** `Admin@1234`

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:seed` | Seed default data |
| `npm run db:reset` | Wipe all data and re-seed (local dev only) |
| `npm run db:studio` | Open Prisma Studio at localhost:5555 |

## Running Tests

```bash
npm test                 # Run all tests once
npm run test:watch       # Watch mode — reruns on file save
npm run test:coverage    # With coverage report
```

## Using Docker for PostgreSQL (Windows)

If you don't have PostgreSQL installed locally:

```cmd
docker run --name lms-postgres ^
  -e POSTGRES_USER=postgres ^
  -e POSTGRES_PASSWORD=password ^
  -e POSTGRES_DB=lms_db ^
  -p 5432:5432 ^
  -d postgres:16
```

Then set `DATABASE_URL=postgresql://postgres:password@localhost:5432/lms_db` in `.env`.

## Project Structure

src/
├── app/ # Next.js App Router pages and API routes
│ ├── (auth)/ # Login, forgot password pages
│ ├── (dashboard)/ # Protected dashboard pages
│ └── api/ # Route handlers
├── components/ # Shared UI components
└── lib/ # Utilities, Prisma client, auth, schemas
prisma/
├── schema.prisma # Database schema
├── seed.ts # Seed script
└── reset.ts # Reset + re-seed script (local dev only)

## Database Backup

```cmd
# Backup
pg_dump -U postgres -d lms_db -F c -f backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%.dump

# Restore
pg_restore -U postgres -d lms_db -F c backup_20260407.dump
```

