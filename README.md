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

### 1. Clone and Setup Environment

```bash
git clone <repository-url>
cd ArogyaAI
cp .env.example backend/.env
```

### 2. Configure Environment Variables

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/arogyaai
JWT_SECRET=your-secure-secret-key
OPENROUTER_API_KEY=your-openrouter-api-key
CLIENT_URL=http://localhost:5173
```

### 3. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4. Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 5. Access Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/api/health

## Environment Variables

### Backend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port (default: 5000) | No |
| NODE_ENV | Environment (development/production) | No |
| MONGODB_URI | MongoDB connection string | Yes |
| JWT_SECRET | JWT signing secret (min 32 chars) | Yes |
| JWT_EXPIRES_IN | Token expiry (default: 7d) | No |
| OPENROUTER_API_KEY | OpenRouter API key | Yes |
| CLIENT_URL | Frontend URL for CORS | No |
| ALLOWED_ORIGINS | Comma-separated allowed origins | No |

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/forgot-password` | Request password reset |
| PATCH | `/api/auth/reset-password/:token` | Reset password |
| PATCH | `/api/auth/update-password` | Update password |

### Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze` | Create new analysis |
| GET | `/api/analyze/:id` | Get analysis by ID |
| GET | `/api/analyze/my-analyses` | List user's analyses |
| POST | `/api/analyze/pre-check` | Quick triage check |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports` | List reports (admin) |
| GET | `/api/reports/:id` | Get report by ID |
| POST | `/api/reports` | Create report |
| PATCH | `/api/reports/:id` | Update report |
| DELETE | `/api/reports/:id` | Delete report |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | API health check |

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
- [x] Helmet security headers

## Project Structure

```
ArogyaAI/
├── backend/
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/    # Route handlers
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # API routes
│   │   ├── middlewares/   # Express middleware
│   │   ├── services/      # Business logic
│   │   ├── utils/         # Utilities
│   │   └── validators/     # Joi schemas
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── components/    # React components
│   │   ├── context/       # React context
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Page components
│   │   └── utils/         # Utilities
│   └── vite.config.js
├── .env.example
├── package.json
└── README.md
```

## Security

- Helmet.js for secure headers
- Rate limiting on all endpoints
- Input validation with Joi
- XSS protection
- CORS configuration
- Password hashing with bcrypt (12 rounds)
- JWT token authentication

## License

MIT
deR3TFyaNN1Bz5ab