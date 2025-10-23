# Vercel + Render Deployment Fix Guide

## 🔴 Critical Issues Found and Fixed

Your chatbot wasn't working because:

1. ❌ Vercel environment variables were pointing to `localhost` instead of your Render backend
2. ❌ Backend CORS wasn't configured to allow your Vercel domain
3. ❌ Vercel configuration was missing

**Status:** ✅ All code fixes applied! Now you just need to update environment variables.

---

## 📋 Step-by-Step Fix Instructions

### **Part 1: Update Render Environment Variables**

1. Go to your Render dashboard: https://dashboard.render.com
2. Click on your service: `michael-kors-chatbot`
3. Click **"Environment"** in the left sidebar
4. Click **"Edit"** button
5. **Add this new variable:**
   ```
   FRONTEND_URL=https://michael-kors-chatbot-xkof.vercel.app
   ```
6. Click **"Save Changes"**
7. ⚠️ **Important:** After saving, click **"Manual Deploy"** → **"Deploy latest commit"** to apply changes

---

### **Part 2: Update Vercel Environment Variables (CRITICAL)**

This is the **MOST IMPORTANT** step - your Vercel variables are currently wrong!

#### Current (WRONG) Values:

- `REACT_APP_API_URL` = `http://localhost:5000` ❌
- `FRONTEND_URL` = `http://localhost:3000` ❌
- `CORS_ORIGIN` = `http://localhost:3000` ❌

#### What You Need to Do:

1. Go to Vercel dashboard: https://vercel.com/dashboard
2. Click on your project: `michael-kors-chatbot-xkof`
3. Click **"Settings"** tab
4. Click **"Environment Variables"** in the left sidebar
5. **DELETE or UPDATE these variables:**

   **Update `REACT_APP_API_URL`:**

   - Click the "..." menu next to `REACT_APP_API_URL`
   - Click "Edit"
   - Change value to: `https://michael-kors-chatbot.onrender.com`
   - Make sure it's enabled for: Production, Preview, and Development
   - Click "Save"

   **DELETE `FRONTEND_URL` and `CORS_ORIGIN`:**

   - These are not needed on the frontend
   - Click "..." → "Delete" for both

6. Click **"Deployments"** tab
7. Click the "..." menu on the latest deployment
8. Click **"Redeploy"** to rebuild with new environment variables

---

### **Part 3: Commit and Push Backend Changes**

The backend code has been updated to allow your Vercel domains. You need to deploy these changes:

```bash
# Stage the changes
git add server/src/index.ts server/src/simple-server.js client/vercel.json

# Commit the changes
git commit -m "Fix: Add Vercel CORS support and deployment configuration"

# Push to trigger Render redeploy
git push origin fix/image-display-clean-final
```

Render will automatically redeploy with the new CORS settings.

---

## 🧪 Testing After Deployment

### 1. Test Backend Endpoints

Open these URLs in your browser:

✅ **Root endpoint:**

```
https://michael-kors-chatbot.onrender.com/
```

Expected response:

```json
{
  "message": "Michael Kors Chatbot API is running!",
  "endpoints": {...}
}
```

✅ **Health check:**

```
https://michael-kors-chatbot.onrender.com/api/health
```

Expected response:

```json
{
  "status": "OK",
  "timestamp": "..."
}
```

### 2. Test Frontend

1. Open: `https://michael-kors-chatbot-xkof.vercel.app`
2. Click on the chatbot icon (bottom right)
3. Type a message: "Show me products"
4. You should get a response!

---

## 🔍 Troubleshooting

### If Vercel still shows "FUNCTION_INVOCATION_FAILED":

1. Check that `vercel.json` was committed and pushed:

   ```bash
   git status
   # Should show client/vercel.json as modified/added
   ```

2. In Vercel dashboard:
   - Go to Settings → General
   - Framework Preset: Should be **"Create React App"** or **"Other"**
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Root Directory: `client`

### If chatbot still shows "Cannot connect to server":

1. Open browser console (F12)
2. Look for the error message
3. Check what URL it's trying to call
4. If it still shows `localhost:5000`, the environment variable didn't update
5. Go back to Vercel → Settings → Environment Variables
6. Make sure `REACT_APP_API_URL` = `https://michael-kors-chatbot.onrender.com`
7. Redeploy again

### If you see CORS errors:

1. Make sure you pushed the backend changes
2. Check Render logs:
   - Go to Render dashboard
   - Click your service
   - Click "Logs" tab
   - Look for CORS-related errors
3. Make sure `FRONTEND_URL` is set correctly on Render

---

## 📊 Quick Checklist

- [ ] Updated `REACT_APP_API_URL` on Vercel to `https://michael-kors-chatbot.onrender.com`
- [ ] Deleted `FRONTEND_URL` and `CORS_ORIGIN` from Vercel
- [ ] Redeployed Vercel project
- [ ] Added `FRONTEND_URL` to Render (value: `https://michael-kors-chatbot-xkof.vercel.app`)
- [ ] Committed and pushed backend CORS changes
- [ ] Render automatically redeployed
- [ ] Tested backend endpoints (all working)
- [ ] Tested frontend chatbot (getting responses)

---

## 🎉 Expected Result

After completing all steps:

- ✅ Backend responds at `https://michael-kors-chatbot.onrender.com`
- ✅ Frontend loads at `https://michael-kors-chatbot-xkof.vercel.app`
- ✅ Chatbot opens when you click the button
- ✅ Chatbot responds to your messages
- ✅ Products are displayed with images

---

## 📞 Still Having Issues?

If after following all steps the chatbot still doesn't work:

1. Share the following with me:

   - Screenshot of Vercel environment variables
   - Screenshot of Render environment variables
   - Browser console errors (F12 → Console tab)
   - Render logs (last 50 lines)

2. Run these tests and share results:

   ```bash
   # Test 1: Check if backend is responding
   curl https://michael-kors-chatbot.onrender.com/api/health

   # Test 2: Check if chat endpoint works
   curl -X POST https://michael-kors-chatbot.onrender.com/chat \
     -H "Content-Type: application/json" \
     -d '{"userId":"test","message":"hello"}'
   ```

I'll help you debug further!
