# Zync — Real-time Video Conferencing

A full-stack video conferencing application built with WebRTC, Socket.IO, and AI-powered meeting summaries.

## 🚀 Live Demo
- Frontend: [your-vercel-link]
- Backend: [your-railway-link]

## ✨ Features
- 🎥 Real-time video and audio calls (WebRTC peer-to-peer)
- 💬 In-call chat with real-time messaging (Socket.IO)
- 🤖 AI meeting summaries powered by Groq (Llama 3)
- 🔐 JWT authentication + Google OAuth
- ✋ Raise hand queue
- 😄 Floating emoji reactions
- 🌙 Dark / Light mode toggle
- 📋 Shareable room codes

## 🛠 Tech Stack

**Frontend**
- React.js + Vite
- Material UI (custom theme)
- Socket.IO Client
- WebRTC (native browser API)
- React Router

**Backend**
- Node.js + Express.js
- Socket.IO (WebRTC signaling server)
- MongoDB + Mongoose
- JWT + Google OAuth
- Groq API (AI summaries)

## 🏗 Architecture
Browser A ──WebRTC (P2P video)──▶ Browser B
│                                  │
└──── Socket.IO (signaling) ───────┘
│
Express Server
│
MongoDB Atlas

## 🔧 Run Locally

### Backend
```bash
cd Backend
npm install
# Create .env from .env.example and fill values
npm run dev
```

### Frontend
```bash
cd Frontend
npm install
# Create .env from .env.example and fill values
npm run dev
```

## 📁 Project Structure
Zync/
├── Backend/
│   ├── app.js
│   └── src/
│       ├── controllers/
│       ├── models/
│       ├── routes/
│       ├── middleware/
│       ├── socket/
│       └── config/
└── Frontend/
└── src/
├── pages/
├── components/
├── context/
├── hooks/
└── services/

## 👨‍💻 Author
Ramakrishna — https://www.linkedin.com/in/rvramakrishna/