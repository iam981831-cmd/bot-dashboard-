# Bot Manager Dashboard

A full-stack web dashboard for managing and monitoring bots (Telegram, Discord, WhatsApp, Slack, and more).

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: SQLite + Prisma ORM
- **Auth**: JWT in httpOnly cookies
- **Encryption**: AES-256-GCM for API keys

## Features

- Bot registry with CRUD operations
- Status tracking (Active / Inactive / Error / Maintenance)
- Manual & auto-ping health checks with response time logging
- Activity log per bot
- Ping history (last 20 pings per bot)
- Dark/light mode
- Search & filter by status/type/tags
- Export/import bots as JSON
- Collapsible sidebar navigation

## Setup

### 1. Install dependencies

```bash
cd bot-dashboard
npm install
```

### 2. Configure environment

Copy `.env.example` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-at-least-32-chars"
ENCRYPTION_KEY="your-32-char-encryption-key-here!!"
ADMIN_PASSWORD="admin123"
```

> **Important**: Change `JWT_SECRET` and `ENCRYPTION_KEY` to random strings before using in production.

### 3. Run database migrations

```bash
npx prisma migrate dev --name init
```

### 4. Seed demo data (optional)

```bash
npm run db:seed
```

This creates 3 example bots and sets up the admin user with the password from your `.env` (`admin123` by default).

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with password `admin123`.

---

## One-liner setup (after cloning)

```bash
npm install && npx prisma migrate dev --name init && npm run db:seed && npm run dev
```

---

## Default Login

- **Password**: `admin123` (set via `ADMIN_PASSWORD` in `.env`)
- Change it immediately after first login via **Settings → Change Password**

---

## Project Structure

```
bot-dashboard/
├── app/
│   ├── api/
│   │   ├── auth/          # Login, logout, me
│   │   ├── bots/          # CRUD + ping + history + activity
│   │   └── settings/      # Password, export, import, clear-history
│   ├── (auth)/login/      # Login page
│   └── (dashboard)/       # Protected dashboard pages
│       ├── dashboard/     # Home with stats
│       ├── bots/          # List + detail + new
│       └── settings/      # Admin settings
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── sidebar.tsx
│   ├── bot-card.tsx
│   ├── bot-form.tsx
│   └── ...
├── lib/
│   ├── auth.ts            # JWT utilities
│   ├── db.ts              # Prisma client singleton
│   ├── encryption.ts      # AES-256-GCM encrypt/decrypt
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── types/
    └── index.ts
```

## Database Schema

| Table         | Description                                      |
|---------------|--------------------------------------------------|
| `User`        | Single admin user with hashed password           |
| `Bot`         | Bot registry with all metadata and config        |
| `PingLog`     | Per-bot ping history (last 20 kept automatically)|
| `ActivityLog` | Manual event/note log per bot                    |

## API Routes

| Method | Path                              | Description             |
|--------|-----------------------------------|-------------------------|
| POST   | `/api/auth/login`                 | Login                   |
| POST   | `/api/auth/logout`                | Logout                  |
| GET    | `/api/bots`                       | List all bots           |
| POST   | `/api/bots`                       | Create bot              |
| GET    | `/api/bots/:id`                   | Get bot                 |
| PUT    | `/api/bots/:id`                   | Update bot              |
| PATCH  | `/api/bots/:id`                   | Partial update          |
| DELETE | `/api/bots/:id`                   | Delete bot              |
| POST   | `/api/bots/:id/ping`              | Manual ping             |
| GET    | `/api/bots/:id/ping-history`      | Ping history            |
| GET    | `/api/bots/:id/activity`          | Activity logs           |
| POST   | `/api/bots/:id/activity`          | Add activity note       |
| POST   | `/api/settings/password`          | Change password         |
| GET    | `/api/settings/export`            | Export bots JSON        |
| POST   | `/api/settings/import`            | Import bots JSON        |
| DELETE | `/api/settings/clear-ping-history`| Clear all ping history  |

## Security Notes

- API keys/tokens are encrypted at rest using AES-256-GCM
- Passwords are hashed with bcrypt (cost factor 12)
- JWT tokens expire after 7 days, stored in httpOnly cookies
- All API routes require authentication
- API keys are never returned to the frontend (shown masked as `****1234`)
- Exports do NOT include API keys for security

## Prisma Studio (visual DB browser)

```bash
npx prisma studio
```

Opens at http://localhost:5555
