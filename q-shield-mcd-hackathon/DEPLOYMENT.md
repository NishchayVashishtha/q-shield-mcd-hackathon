# 🚀 Q-Shield Deployment Guide

This guide will help you deploy Q-Shield to production so anyone can access your project.

## 📋 Prerequisites

- GitHub account
- Netlify/Vercel account (for frontend)
- Render/Railway/Heroku account (for backend)

---

## 🎯 Deployment Strategy

Q-Shield has two components that need separate hosting:

1. **Frontend (React + Vite)** → Netlify or Vercel
2. **Backend (Flask API)** → Render, Railway, or Heroku

---

## 🔧 Part 1: Deploy Backend (Flask API)

### Option A: Deploy to Render (Recommended - Free Tier Available)

1. **Push your code to GitHub** (if not already done)

2. **Go to [Render.com](https://render.com)** and sign up/login

3. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select `q-shield-mcd-hackathon` repo

4. **Configure the service:**
   ```
   Name: qshield-backend
   Region: Choose closest to you
   Branch: main
   Root Directory: backend
   Runtime: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: gunicorn app:app --bind 0.0.0.0:$PORT
   ```

5. **Add Environment Variables:**
   - Click "Environment" tab
   - Add these variables:
     ```
     ALLOWED_ORIGINS=https://your-frontend-url.netlify.app
     DEPLOYER_MNEMONIC=your_algorand_mnemonic_here
     FLASK_ENV=production
     ```

6. **Deploy!** 
   - Click "Create Web Service"
   - Wait 5-10 minutes for deployment
   - Copy your backend URL (e.g., `https://qshield-backend.onrender.com`)

### Option B: Deploy to Railway

1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect Python and deploy
5. Add environment variables in Settings
6. Copy your backend URL

### Option C: Deploy to Heroku

1. Install Heroku CLI: `npm install -g heroku`
2. Login: `heroku login`
3. Create app:
   ```bash
   cd backend
   heroku create qshield-backend
   git push heroku main
   ```
4. Set environment variables:
   ```bash
   heroku config:set ALLOWED_ORIGINS=https://your-frontend.netlify.app
   heroku config:set DEPLOYER_MNEMONIC=your_mnemonic
   ```

---

## 🎨 Part 2: Deploy Frontend (React)

### Option A: Deploy to Netlify (Recommended)

1. **Go to [Netlify.com](https://netlify.com)** and sign up/login

2. **Create New Site**
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub
   - Select your `q-shield-mcd-hackathon` repository

3. **Configure Build Settings:**
   ```
   Base directory: frontend
   Build command: npm run build
   Publish directory: frontend/dist
   ```

4. **Add Environment Variables:**
   - Go to Site Settings → Environment Variables
   - Add these:
     ```
     VITE_APP_ID=761624445
     VITE_BACKEND_URL=https://your-backend-url.onrender.com
     ```
   - **IMPORTANT:** Replace `your-backend-url.onrender.com` with your actual backend URL from Part 1

5. **Deploy!**
   - Click "Deploy site"
   - Wait 2-3 minutes
   - Your site will be live at `https://random-name.netlify.app`

6. **Update Backend CORS:**
   - Go back to your backend hosting (Render/Railway)
   - Update `ALLOWED_ORIGINS` environment variable:
     ```
     ALLOWED_ORIGINS=https://your-actual-frontend.netlify.app
     ```
   - Redeploy backend

### Option B: Deploy to Vercel

1. **Go to [Vercel.com](https://vercel.com)** and sign up/login

2. **Import Project**
   - Click "Add New" → "Project"
   - Import your GitHub repository

3. **Configure:**
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   ```

4. **Add Environment Variables:**
   ```
   VITE_APP_ID=761624445
   VITE_BACKEND_URL=https://your-backend-url.onrender.com
   ```

5. **Deploy!**

---

## ✅ Part 3: Verify Deployment

1. **Test Backend API:**
   ```bash
   curl https://your-backend-url.onrender.com/vote-counts
   ```
   Should return JSON with vote counts

2. **Test Frontend:**
   - Open your Netlify/Vercel URL
   - Check browser console for errors
   - Try the face scanner
   - Cast a test vote

3. **Check CORS:**
   - If you see CORS errors, make sure:
     - Backend `ALLOWED_ORIGINS` includes your frontend URL
     - Frontend `VITE_BACKEND_URL` points to correct backend

---

## 🔒 Security Checklist

- [ ] Backend `ALLOWED_ORIGINS` is set to your frontend domain (not `*`)
- [ ] `DEPLOYER_MNEMONIC` is kept secret (never commit to Git)
- [ ] `.env` files are in `.gitignore`
- [ ] HTTPS is enabled on both frontend and backend
- [ ] Environment variables are set in hosting platforms (not hardcoded)

---

## 🐛 Troubleshooting

### Frontend can't connect to backend
- Check `VITE_BACKEND_URL` in Netlify/Vercel environment variables
- Verify backend is running (visit backend URL in browser)
- Check browser console for CORS errors

### CORS errors
- Update backend `ALLOWED_ORIGINS` to include your frontend URL
- Redeploy backend after changing environment variables

### Backend crashes on startup
- Check Render/Railway logs
- Verify all Python dependencies are in `requirements.txt`
- Check `DEPLOYER_MNEMONIC` is set correctly

### Face detection not working
- Ensure models are in `frontend/public/models/`
- Check browser console for model loading errors
- Verify HTTPS is enabled (camera requires secure context)

---

## 📱 Share Your Project

Once deployed, share these URLs:

- **Live App:** `https://your-project.netlify.app`
- **GitHub Repo:** `https://github.com/yourusername/q-shield-mcd-hackathon`
- **Demo Video:** Record a quick demo showing the voting process

---

## 🔄 Continuous Deployment

Both Netlify and Render support automatic deployments:

- Push to GitHub `main` branch
- Platforms automatically detect changes
- New version deploys in 2-5 minutes

---

## 💰 Cost Estimate

- **Netlify:** Free tier (100GB bandwidth/month)
- **Render:** Free tier (750 hours/month, sleeps after 15 min inactivity)
- **Railway:** $5/month credit on free tier
- **Vercel:** Free tier (100GB bandwidth/month)

**Total Cost: $0-5/month** for hobby/demo projects

---

## 📞 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review platform-specific logs (Render/Netlify dashboard)
3. Verify all environment variables are set correctly
4. Test backend API independently using curl/Postman

---

## 🎉 You're Done!

Your Q-Shield voting system is now live and accessible to anyone with the URL!

**Next Steps:**
- Add custom domain (optional)
- Set up monitoring/analytics
- Add more candidates
- Implement vote result visualization
