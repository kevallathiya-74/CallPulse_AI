# CallPulse AI

CallPulse AI is an AI-powered post-call quality and coaching platform for contact centers.
It analyzes call recordings, scores performance across key QA dimensions, and helps teams improve agent quality with actionable feedback.

## What You Get

- Automated transcription pipeline for uploaded call audio
- Multi-dimensional QA scoring (sentiment, tone, clarity, compliance, resolution, professional language)
- Agent-level analytics and trends
- Dashboard with recent calls and leaderboard insights
- AI coaching insights generated through local LLM inference (Ollama)
- Clerk-based authentication and organization-aware access

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, TanStack Query, Framer Motion, Recharts, Clerk
- Backend: FastAPI, SQLAlchemy Async, Alembic, PostgreSQL
- AI/NLP: Whisper, Transformers, spaCy, VaderSentiment, Ollama

## High-Level Architecture

1. User uploads a call recording from the frontend.
2. Backend stores file metadata and runs analysis pipeline.
3. AI services compute transcript, tone/sentiment, compliance, clarity, and quality dimensions.
4. Scores and report artifacts are stored in PostgreSQL.
5. Dashboard and agent pages consume live API data for reporting and coaching.

## Repository Structure

.
|- backend/
|  |- app/
|  |  |- core/        # config, database
|  |  |- middleware/  # auth, cors, csrf, rate limits, logging
|  |  |- models/      # SQLAlchemy models
|  |  |- routers/     # API endpoints
|  |  |- schemas/     # request/response models
|  |  |- services/    # AI + business logic
|  |  |- utils/
|  |- migrations/     # Alembic migration versions
|  |- uploads/        # input files
|  |- exports/        # report exports
|  |- logs/           # backend logs
|  |- main.py         # FastAPI app entrypoint
|- frontend/
|  |- src/
|  |  |- components/
|  |  |- pages/
|  |  |- hooks/
|  |  |- services/
|  |  |- store/
|  |  |- utils/
|  |- public/
|  |- index.html
|- Docs/
|- Model/

## Prerequisites

- Python 3.10 or newer
- Node.js 18 or newer
- PostgreSQL running locally or remotely
- Ollama installed and running locally
- Clerk project and keys

## Quick Start

### 1. Clone and open workspace

- Clone repository
- Open the root folder in VS Code

### 2. Backend setup

Windows PowerShell:

1. cd backend
2. python -m venv .venv
3. .\.venv\Scripts\Activate.ps1
4. pip install -r requirements.txt
5. Copy .env.example to .env and update values
6. alembic upgrade head
7. uvicorn main:app --reload

macOS/Linux:

1. cd backend
2. python3 -m venv .venv
3. source .venv/bin/activate
4. pip install -r requirements.txt
5. Copy .env.example to .env and update values
6. alembic upgrade head
7. uvicorn main:app --reload

Backend API will run on http://localhost:8000

### 3. Frontend setup

1. Open a new terminal
2. cd frontend
3. npm install
4. Copy .env.example to .env and update values
5. npm run dev

Frontend will run on http://localhost:5173

### 4. Ollama setup

1. Start Ollama service
2. Pull model: ollama pull llama3.1:8b
3. Verify: ollama list

## Environment Configuration

### Backend required keys

- DATABASE_URL
- CLERK_SECRET_KEY
- CLERK_JWKS_URL
- CLERK_AUTHORIZED_PARTIES
- CLERK_WEBHOOK_SECRET
- CORS_ORIGINS

### Backend important optional keys

- WHISPER_MODEL_SIZE (default: base)
- OLLAMA_URL (default: http://localhost:11434)
- OLLAMA_TIMEOUT
- MAX_FILE_SIZE_MB
- LOG_LEVEL
- LOG_FILE

### Frontend required keys

- VITE_API_URL
- VITE_CLERK_PUBLISHABLE_KEY_DEV
- VITE_CLERK_PUBLISHABLE_KEY_PROD

### Frontend optional keys

- VITE_CLERK_PUBLISHABLE_KEY (fallback)
- VITE_APP_ENV
- VITE_IDLE_TIMEOUT_MINUTES
- VITE_IDLE_WARNING_SECONDS
- VITE_HEALTH_CHECK_INTERVAL_SECONDS
- VITE_TOKEN_REFRESH_BEFORE_EXPIRY_SECONDS

## Build and Quality Commands

Frontend:

- npm run dev
- npm run build
- npm run preview
- npm run lint

Backend:

- uvicorn main:app --reload
- alembic upgrade head
- pytest

## API and Health Endpoints

- API docs: http://localhost:8000/docs
- Root status: http://localhost:8000/
- Health: http://localhost:8000/api/health

## Troubleshooting

### CORS errors in browser

- Ensure frontend and backend both use localhost consistently (avoid mixing localhost and 127.0.0.1)
- Verify CORS_ORIGINS includes frontend origin
- Check backend logs for hidden 500 errors that can appear as CORS failures

### Ollama not connected

- Confirm Ollama service is running
- Confirm model exists: ollama list
- Match OLLAMA_URL in backend .env

### Clerk key errors

- Use development publishable key in dev mode
- Use production publishable key in production builds
- Ensure backend Clerk secret and JWKS URL are from the same Clerk app

### Database connection issues

- Verify DATABASE_URL format and credentials
- Ensure PostgreSQL service is up
- Re-run migrations: alembic upgrade head

## Production Notes

- Replace all test Clerk keys with live keys
- Use secure cookie settings and HTTPS
- Restrict CORS_ORIGINS to trusted domains
- Tune model loading and infra resources for expected call volume

## License

This project is licensed under the terms in LICENSE.
