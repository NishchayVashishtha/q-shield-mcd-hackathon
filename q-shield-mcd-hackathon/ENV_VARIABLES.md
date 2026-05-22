# 🔐 Environment Variables Guide

This document lists all environment variables needed for Q-Shield deployment.

## 📦 Backend Environment Variables

Set these in your backend hosting platform (Render/Railway/Heroku):

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `ALLOWED_ORIGINS` | ✅ Yes | Comma-separated list of allowed frontend URLs for CORS | `https://qshield.netlify.app,https://qshield.vercel.app` |
| `DEPLOYER_MNEMONIC` | ✅ Yes | 25-word Algorand wallet mnemonic for deploying transactions | `word1 word2 word3 ... word25` |
| `FLASK_ENV` | ⚠️ Recommended | Flask environment mode | `production` |
| `PORT` | ❌ No | Port number (auto-set by hosting platforms) | `5001` |

### How to Get DEPLOYER_MNEMONIC

1. Create an Algorand wallet at [Pera Wallet](https://perawallet.app/)
2. Switch to Testnet mode
3. Export your 25-word recovery phrase
4. **⚠️ NEVER commit this to Git or share publicly**

### Setting Variables on Different Platforms

**Render:**
- Dashboard → Your Service → Environment → Add Environment Variable

**Railway:**
- Dashboard → Your Project → Variables → New Variable

**Heroku:**
```bash
heroku config:set ALLOWED_ORIGINS=https://your-frontend.netlify.app
heroku config:set DEPLOYER_MNEMONIC="your 25 word mnemonic here"
heroku config:set FLASK_ENV=production
```

---

## 🎨 Frontend Environment Variables

Set these in your frontend hosting platform (Netlify/Vercel):

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_APP_ID` | ✅ Yes | Algorand application ID on testnet | `761624445` |
| `VITE_BACKEND_URL` | ✅ Yes | Full URL of your deployed backend API | `https://qshield-backend.onrender.com` |

### Setting Variables on Different Platforms

**Netlify:**
- Dashboard → Site Settings → Environment Variables → Add a variable

**Vercel:**
- Dashboard → Your Project → Settings → Environment Variables → Add

---

## 🔄 Local Development

For local development, use `.env` files:

### Backend `.env`
```bash
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
DEPLOYER_MNEMONIC=your_25_word_mnemonic_here
FLASK_ENV=development
PORT=5001
```

### Frontend `.env`
```bash
VITE_APP_ID=761624445
VITE_BACKEND_URL=http://127.0.0.1:5001
```

**⚠️ Important:** Never commit `.env` files to Git! They're already in `.gitignore`.

---

## 🔒 Security Best Practices

1. **Never hardcode secrets** in your code
2. **Use `.env.example`** files to document required variables (without actual values)
3. **Rotate secrets** if they're accidentally exposed
4. **Use different values** for development and production
5. **Restrict CORS** to only your frontend domains (never use `*` in production)
6. **Keep mnemonics safe** - they control your Algorand wallet

---

## ✅ Verification Checklist

Before going live, verify:

- [ ] All required variables are set in hosting platforms
- [ ] `ALLOWED_ORIGINS` includes your actual frontend URL
- [ ] `VITE_BACKEND_URL` points to your actual backend URL
- [ ] No `.env` files committed to Git
- [ ] Secrets are not visible in browser DevTools
- [ ] CORS works correctly (no errors in browser console)

---

## 🐛 Troubleshooting

### "CORS policy" error in browser
- **Cause:** Backend `ALLOWED_ORIGINS` doesn't include your frontend URL
- **Fix:** Add your frontend URL to `ALLOWED_ORIGINS` and redeploy backend

### "Failed to fetch" error
- **Cause:** Frontend can't reach backend
- **Fix:** Verify `VITE_BACKEND_URL` is correct and backend is running

### "DEPLOYER_MNEMONIC not set" in backend logs
- **Cause:** Mnemonic environment variable missing
- **Fix:** Add `DEPLOYER_MNEMONIC` in backend hosting platform

### Backend works locally but not in production
- **Cause:** Environment variables not set in hosting platform
- **Fix:** Double-check all variables are set correctly

---

## 📞 Need Help?

If you're stuck:
1. Check your hosting platform's logs
2. Verify all environment variables are set
3. Test backend API independently with curl
4. Check browser console for frontend errors
