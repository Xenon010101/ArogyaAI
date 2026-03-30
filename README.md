# ArogyaAI

AI-Powered Healthcare Analysis Platform built with MERN stack.

## Tech Stack

- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Frontend**: React, Tailwind CSS, Vite
- **AI**: Google Gemini API
- **Features**: JWT Auth, Triage Engine, PDF Reports

## Prerequisites

- Node.js 18+
- MongoDB 6+
- Gemini API Key (from Google AI Studio)

## Quick Start

### 1. Clone and Setup Environment

```bash
git clone <repository-url>
cd ArogyaAI
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Configure Environment Variables

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/arogyaai
JWT_SECRET=your-secure-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your-gemini-api-key
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

## Production Deployment

### Build Frontend

```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`.

### Environment Variables (Production)

Set these environment variables on your deployment platform:

**Backend:**
- `NODE_ENV=production`
- `PORT=5000`
- `MONGODB_URI` - Your MongoDB Atlas connection string
- `JWT_SECRET` - Generate a strong random string
- `GEMINI_API_KEY` - From Google AI Studio
- `CLIENT_URL` - Your deployed frontend URL

**Frontend:**
- `VITE_API_URL` - Your deployed backend URL

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

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | API health check |

## Features

- [x] User authentication (JWT)
- [x] Symptom analysis with AI (Gemini)
- [x] Image analysis support
- [x] Emergency triage detection
- [x] File uploads (images, prescriptions)
- [x] PDF report generation
- [x] Analysis history
- [x] Risk level assessment (low/moderate/high/critical)
- [x] Rate limiting
- [x] Input sanitization
- [x] CORS protection
- [x] Helmet security headers

## AI Response Format

The AI returns structured JSON with:
- `risk_level`: low | moderate | high | critical
- `summary`: Brief analysis
- `conditions`: Possible conditions
- `recommendations`: Action items
- `red_flags`: Warning signs
- `confidence`: 0.0 - 1.0

## Project Structure

```
ArogyaAI/
├── backend/
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Route handlers
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # API routes
│   │   ├── middlewares/   # Express middleware
│   │   ├── services/      # Business logic (AI, Triage)
│   │   ├── utils/         # Utilities
│   │   └── validators/     # Joi schemas
│   ├── .env
│   ├── .env.example
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── components/    # React components
│   │   ├── context/       # Auth context
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Page components
│   │   └── utils/         # PDF generator
│   ├── .env
│   └── vite.config.js
├── .gitignore
└── README.md
```

## Security

- Helmet.js for secure headers
- Rate limiting on all endpoints
- Input validation with Joi
- XSS protection
- CORS configuration
- Password hashing with bcrypt (10 rounds)
- JWT token authentication
- Protected API routes

## License

MIT
