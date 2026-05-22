# 🛡️ Q-Shield: Quantum-Resistant & Privacy-First E-Voting

**Built for MCD Hackathon 2026 - Domain: Digital Democracy**

Q-Shield is a next-generation decentralized voting infrastructure that guarantees 100% voter privacy using Fully Homomorphic Encryption (FHE) and secures the democratic process against future threats using Post-Quantum Cryptography (PQC) on the Algorand blockchain.

## 🚀 Key Innovations
* **AI Bio-Auth:** Liveness detection to prevent deepfakes and proxy voting.
* **FHE Tallying:** Votes are counted while remaining completely encrypted.
* **Quantum-Resistant:** Powered by Falcon signatures on Algorand.
* **Zero-Knowledge Receipts:** Voters can verify their vote was counted without revealing their choice.

## 🛠️ Tech Stack
* **Blockchain:** Algorand (PyTeal), Pera Wallet
* **Artificial Intelligence:** Face-API.js, Tesseract.js OCR
* **Cryptography:** Lattice-based PQC, FHE (Fully Homomorphic Encryption)
* **Frontend:** React, Vite, TailwindCSS
* **Backend:** Flask, Python

## ⚙️ How to Run Locally

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/q-shield-mcd-hackathon.git
cd q-shield-mcd-hackathon
```

### 2. Setup Backend (Flask)
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your DEPLOYER_MNEMONIC
python app.py
```
Backend will run on `http://localhost:5001`

### 3. Setup Frontend (React + Vite)
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env if needed (default values work for local development)
npm run dev
```
Frontend will run on `http://localhost:5173`

### 4. Open in Browser
Visit `http://localhost:5173` and start voting!

---

## 🚀 Deploy to Production

**🎯 Ready to deploy? [START HERE →](./START_HERE.md)**

Your project is deployment-ready! We've created comprehensive guides to help you:

- **[START_HERE.md](./START_HERE.md)** - Choose your deployment path
- **[QUICK_DEPLOY.md](./QUICK_DEPLOY.md)** - Get live in 15 minutes
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Comprehensive deployment guide
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Step-by-step checklist

Quick summary:
- **Frontend:** Deploy to Netlify or Vercel (Free)
- **Backend:** Deploy to Render, Railway, or Heroku (Free tier available)
- **Time:** 15-20 minutes total
- **Cost:** $0/month (free tiers)

## 👥 Team
Nishchay Vashishtha
Paarth
priyanshu Singh
Daksh Nehra