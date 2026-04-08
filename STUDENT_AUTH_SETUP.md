# 🔐 ThinkFirst Student Authentication - Setup Guide

This guide covers everything needed to set up Phase 1 of student authentication with local login/register and OAuth (GitHub, Google).

---

## ✅ What's Been Created

### Backend Components
- ✅ **Student Model** - Database queries for students
- ✅ **Student Controller** - Auth logic (register, login, OAuth callback)
- ✅ **Student Routes** - API endpoints
- ✅ **Student Auth Middleware** - JWT verification
- ✅ **Database Schema** - Students, progress, bookmarks, achievements tables
- ✅ **Dependencies** - passport, passport-github2, passport-google-oauth20

### Frontend Components
- ✅ **StudentLogin.jsx** - Email/password + OAuth buttons
- ✅ **StudentRegister.jsx** - Registration form with validation
- ✅ **StudentDashboard.jsx** - Student stats dashboard
- ✅ **Routes** - `/student/login`, `/student/register`, `/student/dashboard`

---

## 🚀 Setup Instructions

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

Then rebuild your Docker containers:

```bash
docker-compose down
docker-compose up --build
```

---

### Step 2: Set Up GitHub OAuth

#### A. Create GitHub OAuth App

1. Go to **GitHub Settings** → **Developer settings** → **OAuth Apps**
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: ThinkFirst
   - **Homepage URL**: `http://localhost:5173` (dev) or your domain
   - **Authorization callback URL**: `http://localhost:8000/api/v1/student/oauth/github/callback`
4. Copy **Client ID** and **Client Secret**

#### B. Update .env file

Add to backend `.env`:

```env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:8000/api/v1/student/oauth/github/callback
```

---

### Step 3: Set Up Google OAuth

#### A. Create Google OAuth Credentials

1. Go to **Google Cloud Console** → Create new project (name: "ThinkFirst")
2. Enable **Google+ API**
3. Go to **Credentials** → **Create OAuth 2.0 Client ID**
   - Choose **Web application**
   - Add **Authorized redirect URIs**:
     - `http://localhost:8000/api/v1/student/oauth/google/callback`
     - `http://localhost:5173` (frontend)
4. Copy **Client ID** and **Client Secret**

#### B. Update .env file

Add to backend `.env`:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8000/api/v1/student/oauth/google/callback
```

---

### Step 4: Create OAuth Routes (Backend)

Create `backend/src/routes/oauth.routes.js`:

```javascript
import express from "express";
import passport from "passport";

const router = express.Router();

// GitHub OAuth
router.get("/github", passport.authenticate("github", { scope: ["profile", "email"] }));
router.get("/github/callback", passport.authenticate("github", { failureRedirect: "/student/login" }),
  (req, res) => {
    // Redirect to frontend with token
    res.redirect(`http://localhost:5173/student/oauth-success?token=${req.user.token}`);
  }
);

// Google OAuth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/student/login" }),
  (req, res) => {
    // Redirect to frontend with token
    res.redirect(`http://localhost:5173/student/oauth-success?token=${req.user.token}`);
  }
);

export default router;
```

---

### Step 5: Configure Passport (Backend)

Create `backend/src/config/passport.js`:

```javascript
import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import Student from "../models/student.model.js";
import jwt from "jsonwebtoken";

export const configurePassport = (db) => {
  // GitHub Strategy
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const studentInstance = new Student(db);
          let student = await studentInstance.findByProviderUserId("github", profile.id.toString());

          if (!student) {
            student = await studentInstance.create({
              email: profile.emails?.[0]?.value || `github-${profile.id}@thinkfirst.dev`,
              name: profile.displayName || profile.username,
              provider: "github",
              providerUserId: profile.id.toString(),
              profilePicture: profile.photos?.[0]?.value,
              emailVerified: true,
            });
          }

          const token = jwt.sign(
            { id: student.id, email: student.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
          );

          return done(null, { ...student, token });
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Google Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const studentInstance = new Student(db);
          let student = await studentInstance.findByProviderUserId("google", profile.id);

          if (!student) {
            student = await studentInstance.create({
              email: profile.emails?.[0]?.value,
              name: profile.displayName,
              provider: "google",
              providerUserId: profile.id,
              profilePicture: profile.photos?.[0]?.value,
              emailVerified: profile.emails?.[0]?.verified || false,
            });
          }

          const token = jwt.sign(
            { id: student.id, email: student.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
          );

          return done(null, { ...student, token });
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    // Implement if needed
    done(null, null);
  });
};
```

---

### Step 6: Add Passport to Express (Update index.js)

```javascript
import passport from "passport";
import session from "express-session";
import { configurePassport } from "./config/passport.js";

// After connectDB
app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === "production" }
}));

app.use(passport.initialize());
app.use(passport.session());

// Configure passport after DB connection
app.use((req, res, next) => {
  if (req.app.locals.db) {
    configurePassport(req.app.locals.db);
    next();
  } else {
    res.status(500).json({ error: "Database not connected" });
  }
});

// Add OAuth routes
import oauthRoutes from "./routes/oauth.routes.js";
app.use("/auth", oauthRoutes);
```

---

### Step 7: Create OAuth Success Page (Frontend)

Create `frontend/src/pages/OAuthSuccess.jsx`:

```javascript
import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function OAuthSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("studentToken", token);
      navigate("/student/dashboard");
    } else {
      navigate("/student/login");
    }
  }, [searchParams, navigate]);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #080810 0%, #1a1a2e 100%)",
    }}>
      <p style={{ color: "#e8c547", fontSize: 18 }}>Completing authentication...</p>
    </div>
  );
}
```

Add route to `App.jsx`:

```javascript
import OAuthSuccess from "./pages/OAuthSuccess.jsx";

// In Routes
<Route path="/student/oauth-success" element={<OAuthSuccess />} />
```

---

### Step 8: Update Frontend OAuth Button Handler

Modify the OAuth button click handlers in `StudentLogin.jsx` and `StudentRegister.jsx`:

```javascript
const handleOAuthLogin = (provider) => {
  window.location.href = `http://localhost:8000/auth/${provider}`;
};
```

---

### Step 9: Test Everything

#### Test Local Auth:
1. Go to `http://localhost:5173/student/register`
2. Create account with email and password
3. Should redirect to dashboard

#### Test GitHub OAuth:
1. Click "Login with GitHub"
2. Authorize the app
3. Should redirect back to dashboard

#### Test Google OAuth:
1. Click "Login with Google"
2. Select your Google account
3. Should redirect back to dashboard

---

## 🔧 Environment Variables (.env)

Here's a complete `.env` template for backend:

```env
PORT=8000
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Database
DB_HOST=mysql
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=thinkfirst

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@thinkfirst.dev

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:8000/api/v1/student/oauth/github/callback

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8000/api/v1/student/oauth/google/callback

# Session
SESSION_SECRET=your-session-secret-key
```

---

## 📝 API Endpoints

### Authentication
- `POST /api/v1/student/register` - Register with email/password
- `POST /api/v1/student/login` - Login with email/password
- `POST /api/v1/student/oauth-callback` - Handle OAuth callback (used by frontend)
- `POST /api/v1/student/logout` - Logout

### Protected Routes
- `GET /api/v1/student/current` - Get current student + stats
- `PUT /api/v1/student/profile` - Update profile

### OAuth Flows
- `GET /auth/github` - GitHub OAuth login
- `GET /auth/google` - Google OAuth login

---

## 🚨 Troubleshooting

### "Invalid Client ID"
- Check your `.env` file has correct credentials
- Ensure OAuth app is created on correct provider

### "Callback URL mismatch"
- GitHub/Google callback URL must match exactly
- If running on different port, update .env and provider settings

### "Token expired"
- JWT token expires in 7 days
- User needs to login again

### Database connection errors
- Ensure MySQL is running: `docker-compose up mysql`
- Check DB credentials in `.env`
- Run migrations if needed

---

## 🎯 Next Phase Features (Coming Soon)

- [ ] Email verification flow
- [ ] Password reset
- [ ] 2FA authentication
- [ ] Student profile completion
- [ ] Problem history & progress tracking
- [ ] Leaderboard system
- [ ] Streak gamification

---

## 📚 Resources

- [Passport.js Documentation](http://www.passportjs.org/)
- [GitHub OAuth Docs](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Google OAuth Docs](https://developers.google.com/identity/protocols/oauth2)
