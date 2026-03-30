# ArogyaAI

AI-Powered Healthcare Analysis Platform built with MERN stack.

## Tech Stack

- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Frontend**: React, Tailwind CSS, Vite
- **AI**: OpenRouter API (Mistral-7B)
- **Features**: JWT Auth, Triage Engine, PDF Reports

## Prerequisites

- Node.js 18+
- MongoDB 6+
- npm or yarn

## Quick Start

### Backend Setup

```bash
cd backend
cp ../.env.example .env
# Edit .env with your configuration
npm install
npm run dev
```

### Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Environment Variables

### Backend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port | No (default: 5000) |
| MONGODB_URI | MongoDB connection string | Yes |
| JWT_SECRET | JWT signing secret | Yes |
| OPENROUTER_API_KEY | OpenRouter API key | Yes |
| CLIENT_URL | Frontend URL for CORS | No |

### Frontend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| VITE_API_URL | Backend API URL | No (default: localhost:5000) |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Analysis
- `POST /api/analyze` - Create new analysis
- `GET /api/analyze/:id` - Get analysis by ID
- `GET /api/analyze/my-analyses` - List user's analyses
- `POST /api/analyze/pre-check` - Quick triage check

### Health
- `GET /api/health` - Health check

## Project Structure

```
ArogyaAI/
├── backend/
│   ├── src/
│   │   ├── config/        # Configuration
│   │   ├── controllers/   # Route handlers
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # API routes
│   │   ├── middlewares/   # Express middleware
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utilities
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── api/          # API client
│   │   ├── components/    # React components
│   │   ├── context/      # React context
│   │   ├── hooks/        # Custom hooks
│   │   ├── pages/        # Page components
│   │   └── utils/        # Utilities
│   └── vite.config.js
└── .env.example
```

## Features

- [x] User authentication (JWT)
- [x] Symptom analysis with AI
- [x] Emergency triage detection
- [x] File uploads (images, prescriptions)
- [x] PDF report generation
- [x] Analysis history
- [x] Risk level assessment
- [x] Rate limiting
- [x] Input sanitization
- [x] CORS protection

## Security

- Helmet.js for secure headers
- Rate limiting on all endpoints
- Input validation with Joi
- XSS protection
- CORS configuration
- Password hashing with bcrypt

## License

MIT
