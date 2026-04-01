# ArogyaAI - Healthcare Analysis Platform

## Quick Setup

### 1. Clone & Install
```bash
git clone <repo-url>
cd ArogyaAI
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Setup Environment Variables
```bash
cd backend
cp .env.example .env
```

Then edit `.env` and add your credentials:
- **MONGODB_URI**: Get from [MongoDB Atlas](https://www.mongodb.com/atlas)
- **GEMINI_API_KEY**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **JWT_SECRET**: Any random string for authentication

### 3. Run the Project
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 4. Open in Browser
```
http://localhost:5173
```

---

## Features
- AI-powered health symptom analysis
- PDF report generation
- User authentication
- File upload support (images, prescriptions)
