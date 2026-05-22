# 📁 Q-Shield Project Structure

This document explains the organization of the Q-Shield codebase.

```
q-shield-mcd-hackathon/
├── 📄 README.md                    # Main project documentation
├── 📄 DEPLOYMENT.md                # Comprehensive deployment guide
├── 📄 DEPLOYMENT_CHECKLIST.md      # Step-by-step deployment checklist
├── 📄 ENV_VARIABLES.md             # Environment variables documentation
├── 📄 PROJECT_STRUCTURE.md         # This file
├── 🚀 start.sh                     # Quick start script (Linux/Mac)
├── 🚀 start.bat                    # Quick start script (Windows)
├── 📄 .gitignore                   # Git ignore rules
│
├── 🎨 frontend/                    # React + Vite frontend application
│   ├── 📦 package.json             # Node.js dependencies
│   ├── 📦 package-lock.json        # Locked dependency versions
│   ├── ⚙️ vite.config.js           # Vite configuration
│   ├── ⚙️ tailwind.config.js       # TailwindCSS configuration
│   ├── ⚙️ postcss.config.js        # PostCSS configuration
│   ├── ⚙️ eslint.config.js         # ESLint configuration
│   ├── 🔐 .env                     # Environment variables (local)
│   ├── 🔐 .env.example             # Environment variables template
│   ├── 🚀 netlify.toml             # Netlify deployment config
│   ├── 🚀 vercel.json              # Vercel deployment config
│   ├── 📄 .gitignore               # Frontend-specific git ignores
│   ├── 📄 README.md                # Frontend documentation
│   ├── 📄 index.html               # HTML entry point
│   │
│   ├── 📁 src/                     # Source code
│   │   ├── 🎯 main.jsx             # React entry point
│   │   ├── 🎯 App.jsx              # Main App component
│   │   ├── 🎨 App.css              # App styles
│   │   ├── 🎨 index.css            # Global styles
│   │   ├── 🤖 gatekeeper.js        # AI face detection logic
│   │   ├── 📄 QShieldVoting.arc56.json  # Algorand contract ABI
│   │   │
│   │   ├── 📁 components/          # React components
│   │   │   ├── FaceScanner.jsx     # Face scanning & verification
│   │   │   └── VoteForm.jsx        # Voting form component
│   │   │
│   │   └── 📁 assets/              # Static assets
│   │       ├── hero.png
│   │       ├── react.svg
│   │       └── vite.svg
│   │
│   └── 📁 public/                  # Public static files
│       ├── favicon.svg
│       ├── icons.svg
│       └── 📁 models/              # Face detection AI models
│           ├── face_expression_model-*
│           ├── face_landmark_68_model-*
│           ├── face_recognition_model-*
│           └── ssd_mobilenetv1_model-*
│
├── 🔧 backend/                     # Flask Python backend
│   ├── 🐍 app.py                   # Main Flask application
│   ├── 🔐 fhe_engine.py            # FHE encryption & Algorand integration
│   ├── 📦 requirements.txt         # Python dependencies
│   ├── 🔐 .env                     # Environment variables (local)
│   ├── 🔐 .env.example             # Environment variables template
│   ├── 🚀 Procfile                 # Heroku deployment config
│   ├── 🚀 render.yaml              # Render deployment config
│   ├── 🚀 railway.toml             # Railway deployment config
│   ├── 🚀 runtime.txt              # Python version specification
│   └── 📁 __pycache__/             # Python cache (ignored by git)
│
├── 🤖 ai-engine/                   # AI face detection module
│   ├── 📦 package.json             # Node.js dependencies
│   ├── 📦 package-lock.json        # Locked dependency versions
│   ├── 🎯 index.js                 # Main export
│   ├── 📁 src/
│   │   ├── gatekeeper.js           # Face verification logic
│   │   └── watchdog.js             # Liveness detection
│   └── 📁 models/                  # AI model manifests
│       ├── face_expression_model-weights_manifest.json
│       ├── face_landmark_68_model-weights_manifest.json
│       ├── face_recognition_model-weights_manifest.json
│       └── ssd_mobilenetv1_model-weights_manifest.json
│
├── 🔐 crypto-engine/               # Cryptography utilities (placeholder)
│   └── .gitkeep
│
├── 📁 mart-contracts/              # Algorand smart contracts
│   ├── ⚙️ .algokit.toml            # AlgoKit configuration
│   ├── 📁 projects/
│   │   └── 📁 mart-contracts/
│   │       ├── 🐍 demo.py          # Contract demo script
│   │       ├── 📦 pyproject.toml   # Python project config
│   │       ├── 📦 poetry.lock      # Poetry dependencies
│   │       ├── 🔐 .env             # Contract environment variables
│   │       └── 📁 smart_contracts/
│   │           ├── 📁 artifacts/   # Compiled contract artifacts
│   │           │   └── 📁 q_shield_voting/
│   │           │       ├── QShieldVoting.arc56.json
│   │           │       └── QShieldVoting.approval.teal
│   │           └── 📁 q_shield_voting/
│   │               └── contract.py  # Smart contract source
│   │
│   └── 📄 README.md                # Contracts documentation
│
├── 📁 docs/                        # Additional documentation
│   └── .gitkeep
│
├── 🚀 deploy_testnet.py            # Testnet deployment script v1
├── 🚀 deploy_testnet_v2.py         # Testnet deployment script v2
└── 💰 fund_app.py                  # App funding script

```

---

## 🎯 Key Components

### Frontend (`/frontend`)
- **Framework:** React 19 with Vite 8
- **Styling:** TailwindCSS
- **AI:** Face-API.js for face detection
- **OCR:** Tesseract.js for Aadhar card reading
- **Blockchain:** AlgoKit Utils for Algorand integration

**Main Files:**
- `App.jsx` - Main application component with verification flow
- `FaceScanner.jsx` - Handles Aadhar upload, OCR, and face verification
- `VoteForm.jsx` - Voting interface after verification
- `gatekeeper.js` - AI face detection and liveness verification logic

### Backend (`/backend`)
- **Framework:** Flask (Python)
- **Encryption:** FHE (Fully Homomorphic Encryption)
- **Blockchain:** Algorand SDK for testnet integration
- **CORS:** Configured for cross-origin requests

**Main Files:**
- `app.py` - Flask API with endpoints for voting and face verification
- `fhe_engine.py` - Encryption engine and Algorand transaction handling

**API Endpoints:**
- `GET /vote-counts` - Fetch current vote tallies from blockchain
- `POST /check-face` - Verify if face has already voted
- `POST /cast-vote` - Submit encrypted vote to blockchain

### AI Engine (`/ai-engine`)
- **Purpose:** Shared face detection module
- **Used by:** Frontend (via npm dependency)
- **Models:** Face detection, landmark detection, recognition

### Smart Contracts (`/mart-contracts`)
- **Language:** Python (PyTeal)
- **Platform:** Algorand
- **Network:** Testnet
- **App ID:** 761624445

**Contract Functions:**
- `start_election()` - Initialize voting
- `cast_vote(encrypted_vote, candidate_id)` - Record vote
- Global state stores vote counts for Alpha and Beta candidates

---

## 🔄 Data Flow

1. **User uploads Aadhar card** → Frontend
2. **OCR extracts Aadhar number** → Tesseract.js
3. **Face extracted from Aadhar** → Face-API.js
4. **Live camera verification** → Face-API.js (liveness + match)
5. **Face descriptor sent to backend** → POST `/check-face`
6. **Backend checks for duplicates** → In-memory store
7. **User selects candidate** → VoteForm
8. **Vote encrypted with FHE** → Backend `fhe_engine.py`
9. **Transaction sent to Algorand** → Testnet App ID 761624445
10. **Vote counts updated** → Blockchain global state
11. **Frontend polls for results** → GET `/vote-counts`

---

## 🚀 Deployment Files

### Frontend Deployment
- `netlify.toml` - Netlify configuration
- `vercel.json` - Vercel configuration
- `.env.example` - Environment variables template

### Backend Deployment
- `requirements.txt` - Python dependencies
- `Procfile` - Heroku configuration
- `render.yaml` - Render configuration
- `railway.toml` - Railway configuration
- `runtime.txt` - Python version
- `.env.example` - Environment variables template

---

## 📚 Documentation Files

- `README.md` - Main project overview
- `DEPLOYMENT.md` - Complete deployment guide
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist
- `ENV_VARIABLES.md` - Environment variables reference
- `PROJECT_STRUCTURE.md` - This file

---

## 🔐 Security

**Ignored by Git:**
- `.env` files (contain secrets)
- `node_modules/` (dependencies)
- `__pycache__/` (Python cache)
- `.algokit/` (AlgoKit cache)

**Secrets Management:**
- Environment variables for all sensitive data
- `.env.example` files for documentation
- Never commit mnemonics or private keys

---

## 🛠️ Development Workflow

1. **Clone repository**
2. **Install dependencies:**
   - Frontend: `cd frontend && npm install`
   - Backend: `cd backend && pip install -r requirements.txt`
3. **Set up environment variables:**
   - Copy `.env.example` to `.env` in both frontend and backend
   - Fill in required values
4. **Start development servers:**
   - Backend: `python backend/app.py`
   - Frontend: `npm run dev` (in frontend directory)
5. **Make changes and test**
6. **Commit and push to GitHub**
7. **Automatic deployment** (if CI/CD configured)

---

## 📦 Dependencies

### Frontend
- React 19.2.4
- Vite 8.0.1
- TailwindCSS 3.4.19
- Face-API.js 0.22.2
- Tesseract.js 7.0.0
- AlgoKit Utils 9.2.0
- Algosdk 3.5.2

### Backend
- Flask 3.0.0
- Flask-CORS 4.0.0
- py-algorand-sdk 2.6.0
- algokit-utils 2.3.0
- cryptography 41.0.7
- gunicorn 21.2.0

---

## 🎯 Next Steps

1. Follow `DEPLOYMENT.md` to deploy to production
2. Use `DEPLOYMENT_CHECKLIST.md` to track progress
3. Refer to `ENV_VARIABLES.md` for configuration
4. Share your live demo with the world! 🎉
