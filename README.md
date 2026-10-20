# 🌍 Jaffna Basket Export Intelligence

**AI-powered export compliance platform** for Sri Lankan exporters. Instantly check regulatory compliance for any product across 190+ countries, generate detailed compliance reports, and export with confidence.

🔗 **Live Demo:** [https://regulations-rust.vercel.app](https://regulations-rust.vercel.app)

> **Login:** `admin@jaffnabasket.com` / `Admin123!`

---

## ✨ Features

- 🤖 **AI Compliance Analysis** — Instant risk scoring for any product-country combination
- 🌐 **190+ Country Database** — Food safety, labeling, customs, certificates
- 📄 **PDF Compliance Reports** — Detailed, printable reports per shipment
- 📦 **Bundle Analysis** — Analyze entire product bundles at once
- 🔒 **Role-based Access** — Admin and user roles
- 🧠 **AI Assistant** — Chat with an AI for compliance questions

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Database | PostgreSQL via NeonDB |
| ORM | Prisma 7 |
| Auth | NextAuth v5 |
| UI | Tailwind CSS v4 + shadcn/ui |
| Deployment | Vercel |

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/joshpiraveen/export-intelligence.git
cd export-intelligence
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

The `.env.example` already has the shared NeonDB credentials — no extra setup needed for development.

### 4. Generate Prisma client

```bash
DATABASE_URL="postgresql://..." npx prisma generate
```

Or on Windows PowerShell:

```powershell
$env:DATABASE_URL="postgresql://neondb_owner:npg_5RGyWxw4Ymbr@ep-small-rice-aw7bx07u-pooler.c-12.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
npx prisma generate
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with:
- **Email:** `admin@jaffnabasket.com`
- **Password:** `Admin123!`

---

## 📁 Project Structure

```
app/
├── (auth)/         # Login & Register pages
├── (app)/          # Authenticated app pages
│   ├── dashboard/
│   ├── assessment/ # Compliance assessment flow
│   ├── products/
│   ├── countries/
│   ├── reports/
│   ├── admin/      # Admin panel
│   └── ai-assistant/
├── api/            # API routes
lib/
├── engine/         # Compliance rule engine
│   ├── database-provider.service.ts  # Fetches country-specific regulations from DB
│   ├── rule-engine.service.ts
│   ├── resolution-engine.service.ts
│   └── document-generator.service.ts
├── auth.ts         # NextAuth config
└── db.ts           # Prisma client
prisma/
├── schema.prisma   # Database schema
└── seed.ts         # Seed data
```

## 🗄 Database

Uses **NeonDB** (serverless PostgreSQL). The shared dev database is included in `.env.example`.

Key models: `User`, `Company`, `Product`, `Country`, `Regulation`, `ExportAssessment`, `ComplianceResult`

## 🚢 Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/joshpiraveen/export-intelligence)

Set these environment variables in Vercel:
- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`
- `AUTH_SECRET`
- `AUTH_TRUST_HOST=true`

---

Made with ❤️ for Sri Lankan exporters 🇱🇰
