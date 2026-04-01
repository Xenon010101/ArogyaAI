
# 🚀 ArogyaAI — AI-Powered Healthcare Analysis Platform  

<p align="center">
  <b>🩺 Smart Health Insights | 🤖 AI Triage | 📄 Intelligent Reports</b><br/>
  Built to make healthcare guidance fast, accessible, and scalable
</p>

<p align="center">
  <img src="https://img.shields.io/badge/MERN-Stack-green?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/AI-Google%20Gemini-blue?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Auth-JWT-orange?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Security-High-red?style=for-the-badge"/>
  <img src="https://img.shields.io/github/stars/Xenon010101/ArogyaAI?style=for-the-badge"/>
</p>

---

## 🧠 Overview  

**ArogyaAI** is a full-stack MERN application that leverages **Google Gemini AI** to analyze symptoms, prescriptions, and health data.  

It delivers **structured medical insights, triage detection, and actionable recommendations** — helping users make faster and smarter healthcare decisions.  

---

## ✨ Key Features  

- 🧠 **AI Symptom Analysis**  
- 🚨 **Emergency Triage Detection**  
- 🖼️ **Prescription & Image Analysis**  
- 📄 **PDF Medical Reports**  
- 🔐 **JWT Authentication System**  
- 📊 **Analysis History Tracking**  
- 🛡️ **Enterprise-Level Security**  

---

## 🏗️ Tech Stack  

| Layer       | Technology |
|------------|-----------|
| Frontend   | React, Tailwind CSS, Vite |
| Backend    | Node.js, Express |
| Database   | MongoDB, Mongoose |
| AI Engine  | Google Gemini API |
| Auth       | JWT |
| Security   | Helmet, Rate Limiting, Joi |

---

## 📸 Demo Preview  

<p align="center">
  <img src="https://via.placeholder.com/800x400?text=Dashboard+UI" width="80%"/>
  <img src="https://via.placeholder.com/800x400?text=AI+Analysis+Result" width="80%"/>
  <img src="https://via.placeholder.com/800x400?text=PDF+Report" width="80%"/>
</p>

> ⚠️ Replace with actual screenshots for maximum impact  

---

## ⚙️ Quick Start  

### 1️⃣ Clone Repository  

```bash
git clone https://github.com/Xenon010101/ArogyaAI.git
cd ArogyaAI
````

---

### 2️⃣ Setup Environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secure_secret
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=http://localhost:5173
```

---

### 3️⃣ Install Dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

---

### 4️⃣ Run Development

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

---

## 🌐 Access

* Frontend → [http://localhost:5173](http://localhost:5173)
* Backend → [http://localhost:5000](http://localhost:5000)

---

## 🚀 Production Deployment

```bash
cd frontend
npm run build
```

### Environment Variables

**Backend**

* NODE_ENV=production
* MONGODB_URI
* JWT_SECRET
* GEMINI_API_KEY
* CLIENT_URL

**Frontend**

* VITE_API_URL

---

## 📡 API Overview

### 🔐 Authentication

* POST `/api/auth/register`
* POST `/api/auth/login`
* GET `/api/auth/me`
* PATCH `/api/auth/reset-password/:token`

### 🧠 Analysis

* POST `/api/analyze`
* GET `/api/analyze/:id`
* GET `/api/analyze/my-analyses`
* POST `/api/analyze/pre-check`

### ❤️ Health

* GET `/api/health`

---

## 🧠 AI Response Structure

```json
{
  "risk_level": "low | moderate | high | critical",
  "summary": "Brief analysis",
  "conditions": ["Possible conditions"],
  "recommendations": ["Next steps"],
  "red_flags": ["Warning signs"],
  "confidence": 0.0
}
```

---

## 📁 Project Structure

```
ArogyaAI/
├── backend/
│   ├── src/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── utils/
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── hooks/
```

---

## 🔒 Security

* 🔐 JWT Authentication
* 🛡️ Helmet Security Headers
* 🚦 Rate Limiting
* 🧼 Input Validation (Joi)
* ❌ XSS Protection
* 🌐 CORS Configuration
* 🔑 Bcrypt Password Hashing

---

## 🌍 Real-World Impact

* 🏥 Faster preliminary diagnosis
* 🌍 Helps rural & low-access areas
* ⏳ Reduces unnecessary hospital visits
* 📊 Supports doctors with structured insights

---

## 🏆 Hackathon Highlights

* 💡 Real-world problem solving
* 🤖 AI + Full Stack integration
* 📈 Scalable architecture
* 🌍 Social impact driven

---

## 🔮 Future Improvements

* 📱 Mobile App (Flutter)
* 🌐 Multi-language support
* 🧠 Fine-tuned AI model
* 📊 Health analytics dashboard
* 🏥 Doctor-patient integration

---

## 🤝 Contributing

```bash
git checkout -b feature-name
git commit -m "Add feature"
git push origin feature-name
```

---

## 👨‍💻 Author

**Anmol Patel**
🔗 [https://github.com/Xenon010101](https://github.com/Xenon010101)

---

## 🤝 Contributors

* **Akshita**
  🔗 [https://github.com/Akshita-2307](https://github.com/Akshita-2307)

---

## ⭐ Support

If you like this project:

* Star ⭐ the repo
* Share it on LinkedIn

---

## 💬 Feedback

Have suggestions or ideas?
Feel free to open an issue or connect! 🚀

```

---

## 🔥 Why this is “MAX PRO”

- Badges → instant credibility  
- Clean hierarchy → easy to scan  
- Recruiter-friendly storytelling  
- Hackathon-ready explanation  
- GitHub aesthetic (center align + visuals)  

---

