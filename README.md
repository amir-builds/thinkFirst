# ![ThinkFirst Logo](public/img/logo.png)
### Thinking-First Coding Practice Platform

ThinkFirst is a coding practice platform designed to help learners develop strong problem-solving skills by **thinking and planning before writing code**.

Unlike traditional coding platforms that allow users to immediately start coding, ThinkFirst enforces a planning-first workflow. Learners are encouraged to explain their approach in plain language and receive guided thinking support before the code editor is unlocked.

The platform integrates secure code execution using Judge0 and uses AI as a **supportive mentor** that guides thinking through small reflective questions, without providing solutions or code.

---

## Core Idea

> Good programmers are not fast typers — they are clear thinkers.

ThinkFirst focuses on **how a learner thinks**, not just whether the final output is correct.

---

## Key Features

- 🏠 **Home Page**  
  Simple landing page with project overview and navigation.

- 💻 **Practice Coding (ThinkFirst Flow)**  
  Learners must write a clear approach or plan before accessing the code editor.

- 🧠 **ThinkFirst Mentor AI**  
  AI acts as a guided mentor:  
  - Asks small reflective questions  
  - Highlights assumptions or edge cases  
  - Encourages revision and clarity  
  - Never provides solutions, algorithms, or code

- ⚡ **Code Execution**  
  Secure, real-time code execution using a self-hosted Judge0 instance.

- 🔁 **Learning Through Mistakes**  
  When code fails, learners are guided to reflect on *why* it failed rather than being shown the fix.

- 👨‍💼 **Admin Panel**  
  Admin dashboard to create, update, and manage practice questions.

- 🔐 **OTP Authentication**  
  Secure admin login using OTP-based authentication.

---

## Learning Philosophy

ThinkFirst is built around the following principles:

- Thinking comes before implementation
- Planning improves clarity and confidence
- Mistakes are part of learning
- AI should support reasoning, not replace it

The platform intentionally avoids features like solution reveal buttons, competitive rankings, or answer generation, in order to promote deeper learning.

---

## Tech Stack

### Backend
- Node.js + Express
- MySQL (Dockerized)
- Redis (Dockerized)
- Judge0 (self-hosted using Docker)
- JWT Authentication
- NodeMailer for OTP-based login

### Frontend
- React 18
- Vite
- Tailwind CSS
- Monaco Editor
- React Router
- Axios

---

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- npm or yarn

### Installation

#### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Copy the environment variables file:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with required configurations.

4. Start Judge0 separately:
   ```bash
   docker compose -f docker-compose.judge0.yml up -d
   ```

5. Start backend services:
   ```bash
   docker compose up --build
   ```

   Or run without Docker:
   ```bash
   npm install
   npm run dev
   ```

#### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Usage

Open your browser and navigate to:
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000](http://localhost:8000)

#### Default Admin Credentials

**Note:** For development/demo purposes only.

- Email: admin@thinkfirst.com
- Password: admin123

---

## API Endpoints

### Admin Routes
- `POST /api/v1/admin/login` – Admin login
- `POST /api/v1/admin/verify-otp` – Verify OTP
- `GET /api/v1/admin/current` – Get current admin
- `POST /api/v1/admin/logout` – Logout

### Question Routes
- `GET /api/v1/questions/public` – Get public questions
- `POST /api/v1/questions/create` – Create question (Admin)
- `GET /api/v1/questions/all` – Get all questions (Admin)
- `PUT /api/v1/questions/update/:id` – Update question (Admin)
- `DELETE /api/v1/questions/delete/:id` – Delete question (Admin)

### Code Execution
- `POST /api/v1/runcode/execute` – Execute code with test cases
- `GET /api/v1/runcode/languages` – Get supported languages

---

## Docker Services

- **Backend** – Node.js application (Port 8000)
- **MySQL** – Application database (Port 3306)
- **Redis** – Cache and background services (Port 6379)
- **Judge0** – Code execution engine (Port 2358)
- **Judge0-DB** – PostgreSQL for Judge0
- **Judge0-Redis** – Redis for Judge0 workers

---

## Project Structure

```
thinkFirst/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   │   ├── admin.controller.js
│   │   │   ├── codeExecution.controller.js
│   │   │   └── question.controller.js
│   │   ├── mails/
│   │   │   └── sendAdminOTP.js
│   │   ├── middlewares/
│   │   │   └── adminAuth.middleware.js
│   │   ├── models/
│   │   │   ├── admin.model.js
│   │   │   └── question.model.js
│   │   ├── routes/
│   │   │   ├── admin.routes.js
│   │   │   ├── codeExecution.routes.js
│   │   │   └── question.routes.js
│   │   ├── services/
│   │   │   └── judge.service.js
│   │   ├── utils/
│   │   │   ├── apiError.js
│   │   │   ├── apiResponse.js
│   │   │   ├── asyncHandler.js
│   │   │   ├── compare.js
│   │   │   └── redisClient.js
│   │   └── index.js
│   ├── sql/
│   │   ├── 00-admins.sql
│   │   ├── 10-questions.sql
│   │   └── init.sql
│   ├── .env
│   ├── .env.example
│   ├── Dockerfile
│   ├── docker-compose.judge0.yml
│   ├── docker-compose.yml
│   ├── package.json
│   └── node_modules/
└── frontend/
    ├── src/
    │   ├── admin/
    │   │   ├── AdminDashboard.jsx
    │   │   └── AdminLogin.jsx
    │   ├── components/
    │   ├── pages/
    │   │   ├── CodeEditor.jsx
    │   │   ├── Home.jsx
    │   │   └── Practice.jsx
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    ├── public/
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    ├── vite.config.js
    └── node_modules/
```

---

## License

MIT License
