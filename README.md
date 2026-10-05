# ReachInbox Email Scheduler

A production-grade email scheduling service with a dashboard. It accepts email send requests via APIs, schedules them using BullMQ + Redis (no cron jobs), sends emails through Ethereal Email (fake SMTP), and survives server restarts.

## Tech Stack

- **Backend:** Express.js + TypeScript, BullMQ, PostgreSQL (Sequelize), Elasticsearch, Ethereal Email
- **Frontend:** React + Vite + TypeScript, Tailwind CSS
- **Infrastructure:** Docker, Redis, PostgreSQL, Elasticsearch

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Google OAuth credentials from Google Cloud Console
- Slack App credentials (optional, for Slack notifications)

## Project Structure

```text
outbox/
├── backend/
│   ├── .env
│   ├── package.json
│   └── src/
├── frontend/
│   ├── .env
│   ├── package.json
│   └── src/
└── docker-compose.yml
```

## Environment Variables

### Backend

Create `backend/.env` from `backend/.env.example`:

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=5432
DB_NAME=outbox
DB_USER=postgres
DB_PASSWORD=postgres

REDIS_HOST=localhost
REDIS_PORT=6379

ELASTICSEARCH_URL=http://localhost:9200

GOOGLE_CLIENT_ID=your-google-client-id

JWT_SECRET=your-jwt-secret

SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_REDIRECT_URI=http://localhost:3001/api/slack/callback

MAX_EMAILS_PER_HOUR=200
WORKER_CONCURRENCY=5
MIN_DELAY_BETWEEN_SENDS_MS=2000
```

### Frontend

Create `frontend/.env`:

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

Use the same Google OAuth Web Client ID in both backend and frontend.

Do not commit `.env` files or secrets to Git.

## How to Run

### 1. Start infrastructure

From the project root:

```bash
docker-compose up -d
```

This starts:

- Redis
- PostgreSQL
- Elasticsearch

Verify the containers are running:

```bash
docker-compose ps
```

### 2. Run the backend

Open a terminal:

```bash
cd backend
npm install
npm run dev
```

The backend runs on:

```text
http://localhost:3001
```

The backend starts the Express server and the BullMQ email worker. Database synchronization, Ethereal Email initialization, Elasticsearch initialization, and the worker are started by the backend application.

### 3. Run the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

### 4. BullMQ Dashboard

BullMQ/Bull Board is available at:

```text
http://localhost:3001/admin/queues
```

It provides real-time queue visibility.

## Google OAuth Setup

1. Open Google Cloud Console.
2. Create/select your project.
3. Configure the Google Auth Platform / OAuth consent screen.
4. Create an OAuth 2.0 **Web application** client.
5. Add the authorized JavaScript origin:

```text
http://localhost:5173
```

6. Copy the generated Client ID.
7. Put it in both environment files:

```env
# backend/.env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

```env
# frontend/.env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

8. Restart both backend and frontend after changing `.env`.

## Ethereal Email Setup

This project uses **Ethereal Email as a fake/test SMTP service**. Emails are captured by Ethereal and can be viewed through an Ethereal preview URL instead of being delivered to the real recipient's inbox.

The backend initializes the Ethereal email service when it starts. During development, use the generated Ethereal credentials shown by the backend startup logs and keep those credentials private.

### Testing an email

1. Log in with Google.
2. Open **Compose Email**.
3. Enter a sender email, recipient, subject, and body.
4. Choose a schedule time.
5. Set the delay between sends (default: `2` seconds).
6. Set the hourly limit (default: `200`).
7. Click **Schedule**.
8. Wait for the scheduled time.
9. Confirm the email changes from **Queued** to **Sent**.
10. Open the **Preview/View** link for the sent email to inspect it in Ethereal.

Because Ethereal is a fake SMTP service, the test message is not expected to arrive in the recipient's real Gmail inbox.

## Architecture

### Scheduling Flow

```text
Frontend
   ↓
Express API
   ↓
PostgreSQL
   ↓
BullMQ delayed job
   ↓
Redis
   ↓
BullMQ Worker
   ↓
Ethereal SMTP
   ↓
Elasticsearch index
```

The email is first persisted in PostgreSQL. A BullMQ delayed job is then created in Redis using the email's database ID as the job ID. When the scheduled time is reached, the worker processes the job and sends it through Ethereal SMTP.

### Persistence & Restart Safety

BullMQ jobs persist in Redis with AOF enabled. If the application or worker restarts, the worker reconnects to Redis and resumes processing pending jobs.

PostgreSQL stores the email state, including its current status, scheduled time, job ID, and sent time. Before sending, the worker checks the email status and skips an email that is already marked `sent`. The email database ID is also used as the BullMQ job ID to prevent duplicate jobs.

### Rate Limiting

Rate limiting is implemented with Redis-backed atomic counters.

Counter key pattern:

```text
rate:{senderEmail}:{hourWindow}
```

The worker uses Redis `INCR` and `EXPIRE 3600` to maintain an hourly counter. The default limit is:

```text
200 emails per hour per sender
```

Configure it with:

```env
MAX_EMAILS_PER_HOUR=200
```

When the hourly limit is reached, the job is rescheduled for the next available hour window rather than being permanently dropped. If Slack is connected, a notification is sent when the rate limit is hit.

### Concurrency

BullMQ worker concurrency is configurable and defaults to `5`:

```env
WORKER_CONCURRENCY=5
```

Multiple jobs can therefore be processed concurrently while Redis atomic rate-limit operations protect the per-sender limit. Database updates are performed per email, and email IDs provide idempotency.

### Delay Between Sends

A minimum delay of 2 seconds between individual sends is configured by:

```env
MIN_DELAY_BETWEEN_SENDS_MS=2000
```

The BullMQ queue uses a rate limiter equivalent to:

```text
max: 1
duration: 2000ms
```

## Behavior Under Load

For a large batch such as 1000+ emails scheduled for the same time:

1. Emails are persisted in PostgreSQL.
2. BullMQ stores delayed jobs in Redis.
3. Workers process jobs with the configured concurrency.
4. The queue-level limiter enforces the minimum delay between sends.
5. Redis atomic counters enforce the hourly sender limit.
6. Jobs that hit the hourly limit are rescheduled to the next available hour window.

## Features Implemented

### Backend

- **Scheduler**
  - API-based email scheduling
  - BullMQ delayed jobs
  - No OS-level cron, `node-cron`, or Agenda
  - Configurable minimum delay between sends
  - Batch email scheduling

- **Persistence**
  - PostgreSQL persistence using Sequelize
  - Email status tracking: `scheduled`, `queued`, `sending`, `sent`, `failed`, `rate_limited`
  - Redis persistence with AOF for BullMQ jobs
  - Restart-safe job processing
  - Idempotency checks to prevent re-sending
  - Email ID used as the BullMQ job ID for deduplication

- **Rate Limiting**
  - Redis-backed atomic counters
  - Per-sender hourly limits
  - Default limit of 200 emails/hour
  - Automatic rescheduling when the limit is reached
  - Optional Slack notification when the limit is hit

- **Concurrency**
  - Configurable BullMQ worker concurrency
  - Default concurrency of 5
  - Safe parallel processing using atomic Redis counters and per-email database updates

- **Search & Monitoring**
  - Elasticsearch indexing/search
  - BullMQ/Bull Board dashboard
  - API endpoints for scheduled and sent emails

### Frontend

- **Authentication**
  - Google OAuth login
  - Authenticated dashboard

- **Dashboard**
  - Scheduled email table
  - Sent email table
  - Email status indicators
  - Search interface

- **Compose / Scheduling**
  - Compose email form
  - Sender email
  - Recipient entry
  - CSV recipient upload
  - Subject and body
  - Schedule time
  - Per-send delay configuration
  - Hourly rate-limit configuration

- **Integrations**
  - Slack connection UI
  - Slack OAuth flow
  - Slack connection status

## API Endpoints

- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/me` - Get current user
- `POST /api/emails/schedule` - Schedule batch of emails
- `GET /api/emails/scheduled` - Get scheduled emails
- `GET /api/emails/sent` - Get sent emails
- `GET /api/search?q=query` - Search emails with Elasticsearch
- `GET /api/slack/connect` - Start Slack OAuth
- `GET /api/slack/callback` - Slack OAuth callback
- `GET /api/slack/status` - Check Slack connection
- `DELETE /api/slack/disconnect` - Disconnect Slack
- `/admin/queues` - BullMQ Dashboard

## Slack Integration Setup

Slack is optional and is used for notifications when the email rate limit is reached.

1. Create a Slack App.
2. Add OAuth scopes:
   - `chat:write`
   - `incoming-webhook`
3. Set the redirect URL:

```text
http://localhost:3001/api/slack/callback
```

4. Add the credentials to `backend/.env`:

```env
SLACK_CLIENT_ID=your-slack-client-id
SLACK_CLIENT_SECRET=your-slack-client-secret
SLACK_REDIRECT_URI=http://localhost:3001/api/slack/callback
```

5. In the dashboard, click **Connect Slack** to authorize.

## Environment Variable Reference

| Variable | Description | Default |
|---|---|---|
| `PORT` | Backend server port | `3001` |
| `NODE_ENV` | Runtime environment | `development` |
| `FRONTEND_URL` | Frontend URL | `http://localhost:5173` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | PostgreSQL database | `outbox` |
| `DB_USER` | PostgreSQL user | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `postgres` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `ELASTICSEARCH_URL` | Elasticsearch URL | `http://localhost:9200` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | - |
| `VITE_GOOGLE_CLIENT_ID` | Frontend Google OAuth Client ID | - |
| `SLACK_CLIENT_ID` | Slack OAuth Client ID | - |
| `SLACK_CLIENT_SECRET` | Slack OAuth Client Secret | - |
| `SLACK_REDIRECT_URI` | Slack OAuth callback | `http://localhost:3001/api/slack/callback` |
| `JWT_SECRET` | JWT signing secret | - |
| `MAX_EMAILS_PER_HOUR` | Maximum emails/hour/sender | `200` |
| `WORKER_CONCURRENCY` | BullMQ worker concurrency | `5` |
| `MIN_DELAY_BETWEEN_SENDS_MS` | Minimum delay between sends | `2000` |

## No Cron Jobs

The scheduler uses BullMQ delayed jobs exclusively. There is no OS-level cron, `node-cron`, or Agenda. Scheduling is event-driven and persisted through Redis.

## Testing Checklist

- [ ] Docker services are running
- [ ] Google OAuth login works
- [ ] Email can be composed and scheduled
- [ ] Scheduled email appears in the dashboard
- [ ] BullMQ job appears in `/admin/queues`
- [ ] Worker processes the job at the scheduled time
- [ ] Email changes to `sent`
- [ ] Ethereal preview can be opened
- [ ] Multiple emails respect the minimum delay
- [ ] Hourly rate limiting reschedules excess jobs
- [ ] Restarting the backend does not lose pending BullMQ jobs
- [ ] Elasticsearch search returns indexed emails
- [ ] Slack notification works when Slack is connected
