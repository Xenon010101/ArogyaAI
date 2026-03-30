# ArogyaAI Backend

Express + MongoDB API for the ArogyaAI healthcare application.

## Setup

```bash
cd backend
cp ../.env.example .env
# Edit .env with your configuration
npm install
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `PATCH /api/auth/reset-password/:token` - Reset password
- `PATCH /api/auth/update-password` - Update password

### Analysis
- `POST /api/analyze` - Create new analysis
- `GET /api/analyze/:id` - Get analysis by ID
- `GET /api/analyze/my-analyses` - List user's analyses
- `POST /api/analyze/pre-check` - Quick triage check

### Reports
- `GET /api/reports` - List reports
- `GET /api/reports/:id` - Get report
- `POST /api/reports` - Create report
- `PATCH /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report

### Files
- `GET /api/files/:filename` - Get uploaded file

### Health
- `GET /api/health` - Health check
