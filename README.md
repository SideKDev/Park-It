# 🅿️ Park-IT

**Your parking sidekick. Never get a parking ticket again.**

Built by **Sidekick Studios**

---

## 📖 Documentation

**[View Interactive Architecture Diagram →](https://sidekdev.github.io/Park-It/architecture.html)**

The architecture docs include:
- System overview & data flow
- MVP scope & timeline
- Tech stack decisions
- GitHub file structure
- Development checklist

---

## 🎯 What is Park-IT?

Park-IT is a mobile app that helps NYC car owners avoid parking tickets by:

1. **Detecting** when you park (manual or automatic)
2. **Checking** parking rules for that location (street cleaning, meters, etc.)
3. **Showing** your status — 🟢 Good | 🟡 Caution | 🔴 Move your car
4. **Sending** notifications before your time expires

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile | React Native + Expo |
| Language | TypeScript |
| State | Zustand |
| Backend | Python + FastAPI |
| Database | PostgreSQL |
| Auth | Apple & Google SSO |

---

## 📁 Project Structure
```
Park-It/
├── mobile/          # React Native + Expo app
├── backend/         # Python FastAPI server
├── docs/            # Documentation
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Expo CLI (`npm install -g expo-cli`)

### Mobile App
```bash
cd mobile
npm install
npx expo start
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn api.main:app --reload
```

---

## 👥 Team

- **Wayne** — Engineering
- **Alise** — Engineering
- **NO PMS NEEDED BWAHAHAHAH**

---

## 📄 License

2025 © Sidekick Studios
