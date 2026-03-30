# ArogyaAI Frontend

React + Tailwind CSS frontend for the ArogyaAI healthcare application.

## Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Environment Variables

```
VITE_API_URL=http://localhost:5000/api
```

## Pages

| Route | Description |
|-------|-------------|
| `/login` | User login |
| `/register` | User registration |
| `/dashboard` | Main dashboard with stats |
| `/analyze` | New health analysis |
| `/result/:id` | Analysis result details |
| `/history` | Analysis history |

## Features

- JWT authentication
- AI-powered symptom analysis
- Triage engine integration
- File uploads (images, prescriptions)
- Risk level assessment
- Analysis history
- Responsive design
