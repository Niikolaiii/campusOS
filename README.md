# CampusOps — Render deployment

CampusOps is a Next.js application served by a Node.js web service. The same Render service serves the frontend and API, and the API stores shared records in Render PostgreSQL. It no longer saves equipment, maintenance requests, user accounts, or authentication state in browser storage. Theme and language preferences remain local to each browser. Environmental readings are simulated for demonstration; they are not sensor hardware data.

## Deploy to Render

1. Put this project in a Git repository and connect that repository to Render.
2. In Render, choose **New → Blueprint** and select the repository containing `render.yaml`.
3. Review the Blueprint. It creates one Node web service and one PostgreSQL database in Singapore. On first setup, enter `ADMIN_EMAIL`, a unique `ADMIN_PASSWORD`, and a private `STAFF_INVITE_CODE` when prompted. Render generates `SESSION_SECRET` and connects `DATABASE_URL` internally. Share the invitation code only with intended demo users.
4. Deploy. The service health check at `/api/health` confirms the database connection. The first API request creates the schema and seeds example equipment and maintenance records.
5. Open the `onrender.com` HTTPS URL. Register a staff account, then use the configured admin email and password to sign in as administrator.

The Render service uses a signed, HTTP-only, Secure (in production), SameSite session cookie. Passwords for registered staff accounts are stored as salted scrypt hashes. API routes enforce sign-in and administrator-only writes on the server. Never add the secret values to source control or browser code.

## Local development

Requirements: Node.js 22.13+ and pnpm. Copy `.env.example` to `.env.local`; use a PostgreSQL connection URL and private values for the listed variables. Then run:

```sh
corepack enable
pnpm install
pnpm dev
```

The tables and seed records are created automatically when the API first connects. Do not point a public deployment at a local SQLite file or a laptop-only database.

## Data lifetime and prototype limits

The included Blueprint selects Render's free web-service and PostgreSQL plans for a low-cost demonstration. Render's current free PostgreSQL databases expire after 30 days, so upgrade the database before that deadline if you need to keep its data. Free web services can spin down while idle and take time to wake. For persistent long-term use, select a paid PostgreSQL plan and an appropriate web-service plan in the Render Dashboard.

Staff signup requires the private invitation code. The administrator account is separately configured by environment variables. Render web services have a public URL, so invite codes and admin credentials should be shared only with intended viewers. Sensor and energy readings are simulated and reset when the page is refreshed.
