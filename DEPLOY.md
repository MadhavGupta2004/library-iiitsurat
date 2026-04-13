# Deploying the Library Management System

This guide deploys the app as **one service**: the Node backend serves the built React frontend. Recommended: **Render** (free tier) + **MongoDB Atlas** (free tier).

---

## 1. MongoDB Atlas (database)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and create a free account.
2. Create a **free cluster** (e.g. M0).
3. **Database Access** → Add Database User (username + password). Note the password.
4. **Network Access** → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`) for Render.
5. **Database** → Connect → **Connect your application** → copy the connection string.  
   It looks like: `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/DBNAME?retryWrites=true&w=majority`
6. Replace `USER`, `PASSWORD`, and optionally `DBNAME` (e.g. `library_iiitsurat`).  
   Example: `MONGODB_URI=mongodb+srv://myuser:mypass@cluster0.xxxxx.mongodb.net/library_iiitsurat?retryWrites=true&w=majority`

---

## 2. Push code to GitHub

1. Initialize git (if not already):
   ```bash
   cd MiniProject
   git init
   ```
2. Create a repo on GitHub, then:
   ```bash
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/MadhavGupta2004/YOUR_REPO.git
   git branch -M main
   git push -u origin main
   ```

---

## 3. Deploy on Render

1. Go to [render.com](https://render.com) and sign up (GitHub login is fine).
2. **Dashboard** → **New** → **Web Service**.
3. Connect your GitHub repo (authorize if needed) and select the **MiniProject** repository.
4. Use these settings:

   | Field | Value |
   |-------|--------|
   | **Name** | `library-iiitsurat` (or any name) |
   | **Region** | Choose nearest (e.g. Oregon) |
   | **Root Directory** | *(leave blank)* |
   | **Runtime** | Node |
   | **Build Command** | `npm run install:all && npm run build` |
   | **Start Command** | `npm start` |
   | **Instance Type** | Free |

5. **Environment** → Add environment variables:

   | Key | Value |
   |----|--------|
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | Your Atlas connection string from step 1 |
   | `JWT_SECRET` | A long random string (e.g. use a password generator) |
   | `JWT_EXPIRE` | `7d` |
   | `PORT` | *(Render sets this automatically; optional to set)* |
   | `CLIENT_URL` | *(Optional)* Your public site URL for password-reset emails. If omitted on Render, **`RENDER_EXTERNAL_URL`** is used automatically so reset links work from any device. Set `CLIENT_URL` if you add a **custom domain**. |

   If you use Razorpay for payments, also add:

   | Key | Value |
   |----|--------|
   | `RAZORPAY_KEY_ID` | Your key |
   | `RAZORPAY_KEY_SECRET` | Your secret |

   For **email reminders** (due tomorrow + overdue), also add:

   | Key | Value |
   |----|--------|
   | `SMTP_HOST` | e.g. `smtp.gmail.com` |
   | `SMTP_PORT` | `587` |
   | `SMTP_SECURE` | `false` |
   | `SMTP_USER` | Your SMTP username |
   | `SMTP_PASS` | App password or SMTP secret |
   | `SMTP_FROM` | Optional display from, e.g. `"IIIT Surat Library" <you@gmail.com>` |
   | `CRON_SECRET` | Long random string (for external cron, see below) |

6. Click **Create Web Service**. Render will install deps, build the frontend, copy it into `backend/public`, and start the backend.
7. When the deploy finishes, open the service URL (e.g. `https://library-iiitsurat.onrender.com`). You should see the app (login/register).

---

## 4. After first deploy

1. **Seed allowed users (optional)**  
   You can run the seed script once from your machine (with the same `MONGODB_URI` as in Render):
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env and set MONGODB_URI (and JWT_SECRET) to match Render
   node seedAllowedUsers.js
   ```
   Or add the allowed users directly in MongoDB Atlas (Compass or Atlas UI) in the `allowedusers` collection.

2. **Uploaded files**  
   Files in `backend/uploads` are ephemeral on Render (they disappear on redeploy). For production you’d later switch to cloud storage (e.g. S3/Cloudinary); for now book images may reset on redeploy.

3. **Free tier**  
   On the free tier, the service may sleep after inactivity. The first request after sleep can take 30–60 seconds.

4. **Due-date emails on free tier**  
   In-app cron runs only while the server is awake. On Render free, the app sleeps, so schedule emails with an **external cron** (e.g. [cron-job.org](https://cron-job.org)) **POST** once per day to:
   `https://your-app.onrender.com/api/internal/due-reminders`  
   Header: `x-cron-secret: <same value as CRON_SECRET in Render env>`.  
   Body can be empty. This runs the same reminder logic as the daily job.

---

## 5. Local production build (optional)

To test the production build on your machine:

```bash
# From repo root (MiniProject)
npm run install:all
npm run build
NODE_ENV=production npm start
```

Then open `http://localhost:5000`. The same app will be served as on Render.

---

## 6. Modifying / updating a deploy (Render)

Use this whenever you change code or need different settings on the live site.

### A. Deploy new code (most common)

1. Commit and push to the **same GitHub branch** Render is connected to (usually `main`):
   ```bash
   git add .
   git commit -m "Describe your change"
   git push origin main
   ```
2. Open [Render Dashboard](https://dashboard.render.com) → your **Web Service**.
3. Render usually **auto-deploys** after a push. If not: open the service → **Manual Deploy** → **Deploy latest commit**.
4. Wait for the build to finish (green). Open your site URL and hard-refresh (`Ctrl+Shift+R`) if the UI looks old.

### B. Change environment variables (no code change)

1. Render Dashboard → your service → **Environment**.
2. Add, edit, or delete variables (e.g. `SMTP_*`, `CRON_SECRET`, `CLIENT_URL`, `MONGODB_URI`).
3. Click **Save Changes**. Render will **redeploy** automatically so the new values apply.

### C. Change build or start command

1. Service → **Settings**.
2. Edit **Build Command** or **Start Command** (should stay `npm run install:all && npm run build` and `npm start` unless you know what you’re changing).
3. **Save** → triggers a new deploy.

### D. Change connected repo or branch

1. Service → **Settings** → **Build & Deploy**.
2. Adjust **Repository** or **Branch**, then save / deploy.

### E. Custom domain (optional)

1. Service → **Settings** → **Custom Domains** → add your domain and follow Render’s DNS instructions.
2. Set **`CLIENT_URL`** to that domain (e.g. `https://library.iiitsurat.ac.in`) so password-reset emails use the correct link.

---

## Summary

- **One URL**: e.g. `https://your-app.onrender.com` serves both API (`/api/*`, `/uploads/*`) and the React app.
- **Build**: `npm run install:all && npm run build` installs frontend + backend deps, builds React, and copies `frontend/dist` → `backend/public`.
- **Start**: `npm start` runs `node backend/server.js`, which in production serves the API and the static frontend from `backend/public`.
