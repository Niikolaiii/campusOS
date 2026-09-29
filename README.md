# CampusOps — Render deployment

This Render edition uses the final CampusOps interface and stores shared prototype data in Render PostgreSQL. The same Node web service serves the Next.js interface and its API over HTTPS. Equipment, maintenance requests, building-zone controls, alert acknowledgements, and registered staff accounts persist in PostgreSQL. Theme and language preferences remain local to each browser. Sensor readings are simulated for demonstration and are not hardware data.

## Deploy

1. Upload the contents of this folder (not the ZIP file itself) to the root of a GitHub repository.
2. In Render, choose **New → Blueprint** and select that repository. Render reads `render.yaml` and creates the web service and PostgreSQL database in Singapore.
3. Supply `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `STAFF_INVITE_CODE` when prompted. Render generates `SESSION_SECRET` and provides `DATABASE_URL` to the web service.
4. Deploy and wait for the web service to show **Live**. Open its `onrender.com` URL. The service also uses `/api/health` to check the database connection.
5. Use the configured admin email and password to enter administration. Staff accounts are registered with the invitation code.

Do not commit secrets or share admin credentials or the staff invitation code with unintended viewers.

## Inspect saved data

Open the PostgreSQL database in the Render dashboard, choose **Apps**, and deploy pgAdmin. Connect to the database using the credentials shown by Render. In pgAdmin's Query Tool, run:

```sql
SELECT updated_at,
       jsonb_array_length(value->'equipment') AS equipment_count,
       jsonb_array_length(value->'tickets') AS maintenance_count,
       value->'equipment' AS equipment,
       value->'tickets' AS maintenance_requests,
       value->'zones' AS building_controls
FROM prototype_state
WHERE key = 'campusops';
```

Run the query again after making an app change. Registered staff accounts are stored separately in `app_users`; passwords are stored as salted hashes.

## Local development

Requirements: Node.js 22.13+ and pnpm. Copy `.env.example` to `.env.local` and configure `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `STAFF_INVITE_CODE`. Then:

```sh
corepack enable
pnpm install
pnpm dev
```

Open `http://localhost:3000`. The database table for the final prototype state is created automatically on the first authenticated save.

## Demo limitations

The Blueprint uses Render's free web-service and PostgreSQL plans. Render's free PostgreSQL databases expire after 30 days, so upgrade the database before then if you need the saved data to remain available. Free web services may sleep while idle and take time to wake. Sensor and energy readings are simulated and refresh during use.
