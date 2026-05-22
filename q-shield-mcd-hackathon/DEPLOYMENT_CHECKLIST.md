# ✅ Deployment Checklist

Use this checklist to ensure smooth deployment of Q-Shield.

## 📝 Pre-Deployment

### Backend Preparation
- [ ] All dependencies listed in `requirements.txt`
- [ ] `.env.example` file created with all required variables
- [ ] CORS configured to accept frontend domain
- [ ] Gunicorn added for production server
- [ ] Environment variables use `os.getenv()` with defaults
- [ ] No hardcoded secrets in code
- [ ] Test backend locally: `python app.py`

### Frontend Preparation
- [ ] All dependencies in `package.json`
- [ ] `.env.example` file created
- [ ] Backend URL uses environment variable (`VITE_BACKEND_URL`)
- [ ] Build command works: `npm run build`
- [ ] No console errors in production build
- [ ] Test frontend locally: `npm run dev`

### Code Quality
- [ ] Remove all `console.log()` statements (or use proper logging)
- [ ] No TODO comments in critical code
- [ ] Error handling in place for API calls
- [ ] Loading states for async operations

## 🚀 Backend Deployment (Choose One)

### Render.com
- [ ] Create account at render.com
- [ ] Connect GitHub repository
- [ ] Set root directory to `backend`
- [ ] Configure build command: `pip install -r requirements.txt`
- [ ] Configure start command: `gunicorn app:app --bind 0.0.0.0:$PORT`
- [ ] Add environment variables:
  - [ ] `ALLOWED_ORIGINS` (your frontend URL)
  - [ ] `DEPLOYER_MNEMONIC` (Algorand wallet)
  - [ ] `FLASK_ENV=production`
- [ ] Deploy and wait for success
- [ ] Copy backend URL (e.g., `https://qshield-backend.onrender.com`)
- [ ] Test API endpoint: `/vote-counts`

### Railway.app
- [ ] Create account at railway.app
- [ ] Import GitHub repository
- [ ] Railway auto-detects Python
- [ ] Add environment variables in Settings
- [ ] Deploy
- [ ] Copy backend URL

### Heroku
- [ ] Install Heroku CLI
- [ ] `heroku login`
- [ ] `heroku create qshield-backend`
- [ ] Set environment variables with `heroku config:set`
- [ ] `git push heroku main`
- [ ] Copy backend URL

## 🎨 Frontend Deployment (Choose One)

### Netlify
- [ ] Create account at netlify.com
- [ ] Import GitHub repository
- [ ] Set base directory: `frontend`
- [ ] Set build command: `npm run build`
- [ ] Set publish directory: `frontend/dist`
- [ ] Add environment variables:
  - [ ] `VITE_APP_ID=761624445`
  - [ ] `VITE_BACKEND_URL=<your-backend-url>`
- [ ] Deploy
- [ ] Copy frontend URL
- [ ] Test in browser

### Vercel
- [ ] Create account at vercel.com
- [ ] Import GitHub repository
- [ ] Set root directory: `frontend`
- [ ] Framework preset: Vite
- [ ] Add environment variables:
  - [ ] `VITE_APP_ID=761624445`
  - [ ] `VITE_BACKEND_URL=<your-backend-url>`
- [ ] Deploy
- [ ] Copy frontend URL
- [ ] Test in browser

## 🔄 Post-Deployment

### Update CORS
- [ ] Go back to backend hosting platform
- [ ] Update `ALLOWED_ORIGINS` environment variable with actual frontend URL
- [ ] Redeploy backend
- [ ] Wait for deployment to complete

### Testing
- [ ] Visit frontend URL in browser
- [ ] Open browser DevTools (F12)
- [ ] Check Console for errors
- [ ] Test face scanner (allow camera permissions)
- [ ] Upload test Aadhar card
- [ ] Complete liveness check
- [ ] Cast a test vote
- [ ] Verify vote appears on blockchain
- [ ] Check vote counts update
- [ ] Test on mobile device
- [ ] Test on different browsers (Chrome, Firefox, Safari)

### Security Verification
- [ ] HTTPS enabled on both frontend and backend
- [ ] No secrets visible in browser DevTools
- [ ] CORS only allows your frontend domain
- [ ] `.env` files not committed to Git
- [ ] Environment variables set in hosting platforms

### Performance
- [ ] Frontend loads in < 3 seconds
- [ ] Face detection models load successfully
- [ ] API responses are fast (< 2 seconds)
- [ ] No memory leaks in browser

## 📱 Sharing

### Documentation
- [ ] Update README.md with live demo link
- [ ] Add screenshots/GIFs of working app
- [ ] Document any known issues
- [ ] Add team member credits

### Links to Share
- [ ] Live frontend URL: `_______________________`
- [ ] Backend API URL: `_______________________`
- [ ] GitHub repository: `_______________________`
- [ ] Algorand app ID: `761624445`
- [ ] Testnet explorer: `https://testnet.explorer.perawallet.app/application/761624445`

### Demo Preparation
- [ ] Record screen demo video (2-3 minutes)
- [ ] Prepare presentation slides
- [ ] Test demo flow multiple times
- [ ] Have backup plan if live demo fails

## 🐛 Troubleshooting

If something goes wrong:

1. **Check Logs**
   - Backend: Check Render/Railway/Heroku logs
   - Frontend: Check browser console (F12)

2. **Verify Environment Variables**
   - All variables set correctly?
   - Frontend URL in backend CORS?
   - Backend URL in frontend env?

3. **Test Independently**
   - Test backend API with curl/Postman
   - Test frontend build locally: `npm run build && npm run preview`

4. **Common Issues**
   - CORS errors → Update `ALLOWED_ORIGINS`
   - 404 errors → Check routing configuration
   - Build failures → Check logs for missing dependencies
   - Camera not working → Ensure HTTPS is enabled

## ✨ Optional Enhancements

- [ ] Add custom domain name
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Add analytics (Google Analytics, Plausible)
- [ ] Implement rate limiting
- [ ] Add database for persistent storage
- [ ] Set up CI/CD pipeline
- [ ] Add automated tests
- [ ] Implement caching (Redis)
- [ ] Add email notifications
- [ ] Create admin dashboard

## 🎉 Success Criteria

Your deployment is successful when:
- ✅ Frontend loads without errors
- ✅ Backend API responds correctly
- ✅ Face scanner works
- ✅ Votes are recorded on blockchain
- ✅ Vote counts update in real-time
- ✅ No CORS errors
- ✅ Works on mobile and desktop
- ✅ HTTPS enabled everywhere

---

**Congratulations! Your Q-Shield project is now live! 🎊**
