# ⚡ Quick Deploy Guide (15 Minutes)

The fastest way to get Q-Shield live on the internet.

## 🎯 What You'll Get

- ✅ Live frontend URL anyone can visit
- ✅ Working backend API
- ✅ Full voting functionality
- ✅ Blockchain integration
- ✅ Free hosting (with limitations)

---

## 🚀 Step 1: Deploy Backend (5 minutes)

### Using Render (Recommended)

1. **Go to [render.com](https://render.com)** → Sign up with GitHub

2. **New Web Service** → Connect your repo → Select `q-shield-mcd-hackathon`

3. **Configure:**
   ```
   Name: qshield-backend
   Root Directory: backend
   Build Command: pip install -r requirements.txt
   Start Command: gunicorn app:app --bind 0.0.0.0:$PORT
   ```

4. **Environment Variables** (click "Add Environment Variable"):
   ```
   ALLOWED_ORIGINS = https://your-app.netlify.app
   DEPLOYER_MNEMONIC = your 25 word algorand mnemonic
   FLASK_ENV = production
   ```
   ⚠️ You'll update `ALLOWED_ORIGINS` after frontend deployment

5. **Create Web Service** → Wait 5 minutes

6. **Copy your backend URL** (e.g., `https://qshield-backend.onrender.com`)

---

## 🎨 Step 2: Deploy Frontend (5 minutes)

### Using Netlify (Recommended)

1. **Go to [netlify.com](https://netlify.com)** → Sign up with GitHub

2. **Add new site** → Import from Git → Select your repo

3. **Configure:**
   ```
   Base directory: frontend
   Build command: npm run build
   Publish directory: frontend/dist
   ```

4. **Environment Variables** (Site settings → Environment variables):
   ```
   VITE_APP_ID = 761624445
   VITE_BACKEND_URL = https://qshield-backend.onrender.com
   ```
   ⚠️ Use YOUR actual backend URL from Step 1

5. **Deploy site** → Wait 3 minutes

6. **Copy your frontend URL** (e.g., `https://qshield-voting.netlify.app`)

---

## 🔄 Step 3: Update CORS (2 minutes)

1. **Go back to Render** → Your backend service

2. **Environment** → Edit `ALLOWED_ORIGINS`

3. **Update with your actual frontend URL:**
   ```
   ALLOWED_ORIGINS = https://qshield-voting.netlify.app
   ```
   ⚠️ Use YOUR actual Netlify URL from Step 2

4. **Save** → Backend will auto-redeploy (2 minutes)

---

## ✅ Step 4: Test (3 minutes)

1. **Open your Netlify URL** in browser

2. **Check browser console** (F12) for errors

3. **Test the flow:**
   - Click "Test Vault Connection" → Should show green
   - Upload an Aadhar card image
   - Complete face verification
   - Cast a vote
   - Check vote counts update

4. **If errors:**
   - CORS error? → Check Step 3
   - Can't connect? → Verify backend URL in Netlify env vars
   - Backend error? → Check Render logs

---

## 🎉 You're Live!

Share your project:
- **Live Demo:** `https://your-app.netlify.app`
- **Backend API:** `https://your-backend.onrender.com`
- **Blockchain:** [View on Algorand Explorer](https://testnet.explorer.perawallet.app/application/761624445)

---

## ⚠️ Important Notes

### Free Tier Limitations

**Render Free Tier:**
- Backend sleeps after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds to wake up
- 750 hours/month free

**Netlify Free Tier:**
- 100GB bandwidth/month
- Unlimited sites
- Auto-deploys on Git push

### Keeping Backend Awake

If you need the backend to stay awake for a demo:

1. Use a service like [UptimeRobot](https://uptimerobot.com) (free)
2. Ping your backend URL every 10 minutes
3. Or upgrade to Render paid plan ($7/month)

---

## 🐛 Troubleshooting

### "Failed to fetch" error
- Backend is sleeping (wait 60 seconds and retry)
- Wrong backend URL in frontend env vars

### CORS error
- `ALLOWED_ORIGINS` doesn't match your frontend URL
- Forgot to redeploy backend after updating CORS

### Build failed
- Check build logs in Render/Netlify
- Missing dependencies? Check requirements.txt/package.json

### Camera not working
- HTTPS required for camera access (Netlify provides this)
- Browser permissions denied (check browser settings)

---

## 📚 Need More Details?

- **Full Guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Checklist:** [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **Environment Variables:** [ENV_VARIABLES.md](./ENV_VARIABLES.md)
- **Project Structure:** [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

---

## 💡 Pro Tips

1. **Custom Domain:** Both Netlify and Render support custom domains (free)
2. **Auto Deploy:** Push to GitHub → Auto-deploys to production
3. **Preview Deploys:** Netlify creates preview URLs for pull requests
4. **Logs:** Check Render logs for backend errors
5. **Analytics:** Add Google Analytics to track visitors

---

## 🎯 Alternative Platforms

### Frontend Alternatives
- **Vercel:** Similar to Netlify, also free
- **GitHub Pages:** Free but requires static site
- **Cloudflare Pages:** Free with great performance

### Backend Alternatives
- **Railway:** $5/month credit on free tier
- **Heroku:** No free tier anymore (paid only)
- **Fly.io:** Free tier available
- **PythonAnywhere:** Free tier for Python apps

---

**Time to deploy: ~15 minutes**
**Cost: $0/month** (with free tier limitations)

Good luck! 🚀
