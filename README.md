# ThinkFirst
### AI-Powered Coding Education Platform

> **Live:** [thinkfirst-app.web.app](https://thinkfirst-app.web.app)

ThinkFirst is a full-stack coding practice platform that guides learners to **think and plan before writing code**. An AI mentor (powered by Google Gemini) engages students through Socratic questioning — never giving away answers, always building reasoning.

---

## Core Idea

> Good programmers are not fast typers — they are clear thinkers.

ThinkFirst enforces a **Think → Plan → Code** workflow. Students must articulate their approach before the code editor unlocks, and the AI mentor guides them through any gaps in understanding.

---

## Key Features

- 🏠 **Home Page** — Landing page with project overview and navigation
- 🧠 **AI Mentor (Gemini 2.5 Flash)** — Socratic guidance that asks reflective questions, highlights edge cases, and never provides direct solutions or code
- 💻 **Practice Coding** — Students write their approach first; code editor unlocks after mentor approval
- ⚡ **Code Execution** — Self-hosted Judge0 supporting **5 languages**: Python, JavaScript, Java, C++, C
- 📊 **Student Dashboard** — Progress tracking, activity heatmap, solved/attempted/skipped stats
- 🔖 **Bookmarks & Achievements** — Students can bookmark questions and earn badges
- 🔐 **Authentication** — Google OAuth, GitHub OAuth, and email/password with JWT
- 👨‍💼 **Admin Panel** — Full CRUD for questions with up to 10 test cases each, public/draft toggle
- 🔒 **Admin OTP Login** — Secure admin authentication via email OTP + JWT

---

## Tech Stack

### Backend
- **Node.js + Express** — REST API
- **MySQL 8** — Primary database (Dockerized, connection pooling)
- **Redis** — Session caching and background jobs
- **Judge0 1.13.1** — Self-hosted code execution engine (privileged Docker container)
- **JWT** — Stateless authentication with refresh tokens
- **Passport.js** — OAuth 2.0 (Google, GitHub)
- **Nodemailer** — OTP email delivery
- **Google Gemini 2.5 Flash** — AI mentor

### Frontend
- **React 18** + **Vite**
- **Monaco Editor** — VS Code-grade in-browser code editor
- **Axios** — HTTP client
- **React Router v6**
- **Tailwind CSS**

### Infrastructure
- **Google Compute Engine** (`e2-standard-2`, europe-west1-b) — Backend + all Docker services
- **Firebase Hosting** — React frontend (CDN-backed, free tier)
- **nginx** — Reverse proxy with SSL termination
- **Let's Encrypt** — Free SSL certificate via Certbot
- **Docker Compose** — 7-container orchestration

---

## Architecture

```
                    ┌─────────────────────────┐
                    │   Firebase Hosting       │
                    │   (React Frontend)       │
                    │ thinkfirst-app.web.app   │
                    └────────────┬────────────┘
                                 │ HTTPS
                    ┌────────────▼────────────┐
                    │   GCE VM (nginx + SSL)  │
                    │   34-52-156-92.nip.io   │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Docker Compose Stack  │
                    │  ┌──────────────────┐   │
                    │  │  Node.js :8000   │   │
                    │  ├──────────────────┤   │
                    │  │  MySQL    :3306  │   │
                    │  ├──────────────────┤   │
                    │  │  Redis    :6379  │   │
                    │  ├──────────────────┤   │
                    │  │  Judge0   :2358  │   │
                    │  │  Judge0-Worker   │   │
                    │  │  Judge0-DB       │   │
                    │  │  Judge0-Redis    │   │
                    │  └──────────────────┘   │
                    └─────────────────────────┘
```

---

## Getting Started (Local Development)

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- npm

### Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in .env with your credentials
docker compose up --build
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Local URLs
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000](http://localhost:8000)

### Default Admin Credentials *(development only)*
- Email: `admin@thinkfirst.com`
- Password: `admin123`

---

## Production Deployment

### Backend (GCE VM)

```bash
# SSH into VM
gcloud compute ssh thinkfirst-vm --zone=europe-west1-b

# Pull latest and rebuild
cd ~/thinkFirst && git pull origin main
cd backend && docker compose up -d --build backend
```

### Frontend (Firebase Hosting)

```bash
cd frontend
npm run build
firebase deploy --only hosting
```

### Environment Files
| File | Location | Purpose |
|---|---|---|
| `backend/.env` | VM only (never commit) | Production secrets |
| `backend/gcp-credentials.json` | VM only (never commit) | GCP service account |
| `frontend/.env.production` | Local only | `VITE_API_BASE_URL` |

---

## API Endpoints

### Admin
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/admin/login` | Send OTP to admin email |
| POST | `/api/v1/admin/verify-otp` | Verify OTP, receive JWT |
| GET | `/api/v1/admin/current` | Get current admin info |
| POST | `/api/v1/admin/logout` | Logout |

### Student
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/student/register` | Register student |
| POST | `/api/v1/student/login` | Email/password login |
| GET | `/api/v1/student/oauth/google` | Google OAuth |
| GET | `/api/v1/student/oauth/github` | GitHub OAuth |
| GET | `/api/v1/student/current` | Current student |
| POST | `/api/v1/student/submit` | Submit solution |

### Questions
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/questions/public` | Public questions list |
| GET | `/api/v1/questions/all` | All questions (Admin) |
| POST | `/api/v1/questions/create` | Create question (Admin) |
| PUT | `/api/v1/questions/update/:id` | Update question (Admin) |
| DELETE | `/api/v1/questions/delete/:id` | Delete question (Admin) |

### Code Execution & AI
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/runcode/execute` | Run code against test cases |
| GET | `/api/v1/runcode/languages` | Supported languages |
| POST | `/api/v1/ai/mentor` | AI mentor chat |

---

## Docker Services

| Service | Image | Port | Purpose |
|---|---|---|---|
| backend | custom | 8000 | Node.js API |
| mysql | mysql:8.0 | 3306 | App database |
| redis | redis:latest | 6379 | Session cache |
| judge0 | judge0/judge0:1.13.1 | 2358 | Code execution API |
| judge0-worker | judge0/judge0:1.13.1 | — | Submission processor |
| judge0-db | postgres:13 | — | Judge0 database |
| judge0-redis | redis:6 | — | Judge0 job queue |

> **Note:** Judge0 requires `privileged: true` and cgroup v1 (`systemd.unified_cgroup_hierarchy=0`) for Linux kernel-level sandboxing.

---

## License

MIT License
