# 🚀 Quick Fix - 3 Steps to Get Your Chatbot Working

## ⚡ The Main Problem

Your Vercel frontend is trying to connect to `http://localhost:5000` instead of your Render backend!

---

## ✅ Step 1: Fix Vercel Environment Variables (5 minutes)

1. Go to: https://vercel.com/dashboard
2. Open your project: `michael-kors-chatbot-xkof`
3. Go to: **Settings** → **Environment Variables**
4. Find `REACT_APP_API_URL` and change it to:
   ```
   https://michael-kors-chatbot.onrender.com
   ```
5. **Delete** these variables (not needed):
   - `FRONTEND_URL`
   - `CORS_ORIGIN`
6. Go to **Deployments** tab → Click "..." → **Redeploy**

---

## ✅ Step 2: Update Render Environment Variables (2 minutes)

1. Go to: https://dashboard.render.com
2. Open: `michael-kors-chatbot`
3. Click: **Environment** tab
4. Click: **Edit**
5. **Add new variable:**
   ```
   Key: FRONTEND_URL
   Value: https://michael-kors-chatbot-xkof.vercel.app
   ```
6. Click **Save Changes**
7. Click **Manual Deploy** → **Deploy latest commit**

---

## ✅ Step 3: Deploy Backend Changes (2 minutes)

Run these commands in your terminal:

```bash
# Commit the fixes I made
git add .
git commit -m "Fix: Add Vercel CORS support and deployment config"

# Push to trigger Render redeploy
git push origin fix/image-display-clean-final
```

Render will automatically redeploy with the new CORS settings.

---

## 🎉 Done! Test It

1. Wait 2-3 minutes for both deployments to finish
2. Open: https://michael-kors-chatbot-xkof.vercel.app
3. Click the chatbot button
4. Send a message
5. **It should work now!** 🎊

---

## 📝 What I Fixed in Your Code

✅ Added `client/vercel.json` - Configures Vercel for React SPA
✅ Updated `server/src/index.ts` - Added Vercel domains to CORS
✅ Updated `server/src/simple-server.js` - Added Vercel domains to CORS

---

## ❓ Still Not Working?

Check the detailed guide: `VERCEL_DEPLOYMENT_FIX.md`

Or test your backend manually:

```bash
curl https://michael-kors-chatbot.onrender.com/api/health
```

Should return:

```json
{ "status": "OK", "timestamp": "..." }
```
