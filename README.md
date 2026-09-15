# CodeCampus 🔥

**Live:** https://codecampus.onrender.com/

> A full-stack competitive coding platform with an online IDE, real-time 1v1 battles, structured learning hub, interactive roadmaps, and GitHub-style streak tracking.

---

## ✨ Features

### Core Platform

* 🏋️ **Coding Challenges** — Full `main()` + logic problems, not just function stubs
* 💻 **Online IDE** — Monaco Editor (VS Code engine) with 12+ languages
* 🚫 **Anti Copy-Paste** — Blocks `Ctrl+V` / `Cmd+V`, paste events, and right-click context menu
* 📊 **Leaderboard** — Ranked by problems solved and streaks
* 🔐 **JWT Auth** — bcrypt password hashing with email-based password reset (OTP)

### ⚔️ Real-Time Versus Mode

* 🎮 **1v1 Code Battles** — Challenge friends with shareable room codes
* ⚡ **Live Sync** — Real-time typing indicators and test-case progress via Socket.IO
* ⏱️ **Timed Matches** — Configurable time limits with auto-submission
* 🏠 **Lobby System** — Redis-backed rooms with host migration and reconnection handling

### 📚 Learning

* 📚 **Learning Hub** — Structured courses with Markdown lessons
* 🗺️ **Interactive Roadmaps** — Visual learning paths with React Flow
* 🔥 **Streak Activity Graph** — GitHub-style contribution heatmap on profiles

### 🛡️ Administration

* 🛡️ **Admin Dashboard** — Full UI for managing problems and courses
* 📝 **Problem CRUD** — Create, edit, publish, and unpublish problems

---

## 🛠️ Tech Stack

| Layer                | Technology                                                |
| -------------------- | --------------------------------------------------------- |
| **Frontend**         | Next.js 16, React 19, TypeScript, Vanilla CSS             |
| **Code Editor**      | `@monaco-editor/react` (VS Code engine)                   |
| **Real-Time**        | Socket.IO (client + server)                               |
| **Visualizations**   | React Flow, react-activity-calendar                       |
| **State Management** | Zustand                                                   |
| **UI Utilities**     | Lucide React, React Icons, React Hot Toast, React Tooltip |
| **Backend**          | Express 5, TypeScript                                     |
| **Database**         | MongoDB (Mongoose 9) + Redis (ioredis)                    |
| **Code Execution**   | Wandbox API                                               |
| **Authentication**   | JWT + bcrypt                                              |
| **Email**            | Nodemailer (SMTP)                                         |
| **Validation**       | Zod                                                       |
| **Security**         | Helmet, express-rate-limit, express-mongo-sanitize, HPP   |

---

## 🚀 Quick Start

### Prerequisites

* **Node.js** v18+
* **Docker Desktop** — for MongoDB + Redis
* npm

If you encounter npm permission issues on macOS/Linux:

```bash
sudo chown -R $(whoami) ~/.npm
```

### 1. Start Databases

```bash
docker-compose up -d
```

This starts:

* MongoDB 7 on port `27017`
* Redis 7 on port `6379`

### 2. Configure Environment

Create `server/.env`:

```env
PORT=5000
NODE_ENV=development

MONGO_URI=mongodb://localhost:27017/codecampus
REDIS_URL=redis://localhost:6379

JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:3000

# Email (for password reset OTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 3. Start Backend

```bash
cd server
npm install
npm run dev
```

### 4. Seed Demo Data

Run these commands the first time you set up the project:

```bash
cd server

npx ts-node src/seedLeetCode.ts
npx ts-node src/seed-courses.ts
```

### 5. Start Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Then open:

http://localhost:3000

### One-Command Install

From the project root:

```bash
npm run install-all
```

This installs dependencies for both the client and server.

---

## 📁 Project Structure

```text
codecampus/
├── client/                         # Next.js 16 frontend
│   └── src/
│       ├── app/                    # App Router pages
│       │   ├── page.tsx            # Landing page
│       │   ├── problems/           # Problem list + solve page
│       │   ├── ide/                # Standalone online IDE
│       │   ├── versus/             # 1v1 battle lobby + match room
│       │   │   └── [roomId]/       # Live match page
│       │   ├── learn/              # Learning hub
│       │   ├── roadmap/            # Interactive visual roadmap
│       │   ├── profile/[username]/ # User profile + streak graph
│       │   ├── leaderboard/        # Global rankings
│       │   ├── admin/              # Admin dashboard
│       │   ├── auth/               # Login + signup
│       │   └── not-found.tsx       # Custom 404 page
│       │
│       ├── components/
│       │   ├── Editor/             # Monaco editor components
│       │   ├── Layout/             # Navbar
│       │   └── Providers/          # Context providers
│       │
│       ├── lib/                    # Axios API client
│       └── store/                  # Zustand auth store
│
├── server/                         # Express 5 + TypeScript backend
│   └── src/
│       ├── index.ts                # Express + Socket.IO + Next.js SSR
│       │
│       ├── models/                 # Mongoose models
│       │   ├── User.model.ts
│       │   ├── Problem.model.ts
│       │   ├── Submission.model.ts
│       │   └── Course.model.ts
│       │
│       ├── controllers/            # Route handlers / business logic
│       │   ├── auth.controller.ts
│       │   ├── problem.controller.ts
│       │   ├── submission.controller.ts
│       │   ├── execute.controller.ts
│       │   ├── user.controller.ts
│       │   └── learn.controller.ts
│       │
│       ├── routes/                 # Express route definitions
│       ├── services/
│       │   ├── piston.service.ts   # Code execution service
│       │   ├── redisService.ts     # Redis lobby/session management
│       │   └── email.service.ts    # Nodemailer email service
│       │
│       ├── sockets/
│       │   └── versusHandler.ts    # Socket.IO 1v1 match logic
│       │
│       ├── middleware/
│       │   ├── auth.middleware.ts  # JWT auth + admin guard
│       │   └── error.middleware.ts # Global error handler
│       │
│       ├── types/                  # TypeScript type definitions
│       ├── utils/                  # Database utilities
│       ├── seedLeetCode.ts         # Problem seeder
│       └── seed-courses.ts         # Course seeder
│
└── docker-compose.yml              # MongoDB + Redis services
```

---

## 📡 API Reference

### Authentication

| Method | Route                       | Auth | Description              |
| ------ | --------------------------- | ---- | ------------------------ |
| `POST` | `/api/auth/signup`          | —    | Register new user        |
| `POST` | `/api/auth/login`           | —    | Login and receive JWT    |
| `GET`  | `/api/auth/me`              | ✅    | Get current user profile |
| `POST` | `/api/auth/forgot-password` | —    | Send password reset OTP  |
| `POST` | `/api/auth/reset-password`  | —    | Reset password with OTP  |

### Problems

| Method  | Route                       | Auth  | Description                   |
| ------- | --------------------------- | ----- | ----------------------------- |
| `GET`   | `/api/problems`             | —     | List all published problems   |
| `GET`   | `/api/problems/:slug`       | —     | Get problem by slug           |
| `POST`  | `/api/problems`             | Admin | Create a new problem          |
| `PATCH` | `/api/problems/:id`         | Admin | Update a problem              |
| `PATCH` | `/api/problems/:id/publish` | Admin | Publish / unpublish a problem |

### Code Execution

| Method | Route                    | Auth | Description              |
| ------ | ------------------------ | ---- | ------------------------ |
| `POST` | `/api/execute`           | —    | Run code via Wandbox     |
| `GET`  | `/api/execute/languages` | —    | List supported languages |

### Submissions

| Method | Route              | Auth | Description                   |
| ------ | ------------------ | ---- | ----------------------------- |
| `POST` | `/api/submissions` | ✅    | Submit solution for judging   |
| `GET`  | `/api/submissions` | ✅    | Get user's submission history |

### Users & Leaderboard

| Method | Route                           | Auth | Description              |
| ------ | ------------------------------- | ---- | ------------------------ |
| `GET`  | `/api/users/leaderboard`        | —    | Get global leaderboard   |
| `GET`  | `/api/users/:username`          | —    | Get user profile         |
| `GET`  | `/api/users/:username/activity` | —    | Get streak/activity data |

### Learning Hub

| Method | Route                                | Auth  | Description         |
| ------ | ------------------------------------ | ----- | ------------------- |
| `GET`  | `/api/learn`                         | —     | List all courses    |
| `GET`  | `/api/learn/:slug`                   | —     | Get course details  |
| `GET`  | `/api/learn/:slug/lessons/:lessonId` | —     | Get specific lesson |
| `POST` | `/api/learn`                         | Admin | Create a new course |

### System

| Method | Route         | Auth | Description             |
| ------ | ------------- | ---- | ----------------------- |
| `GET`  | `/api/health` | —    | Health check and uptime |

---

## ⚔️ Versus Mode — Socket.IO Events

Real-time 1v1 code battles use Socket.IO with Redis-backed lobbies.

| Event                     | Direction       | Description                    |
| ------------------------- | --------------- | ------------------------------ |
| `room:create`             | Client → Server | Create a new match room        |
| `room:created`            | Server → Client | Return the generated room code |
| `room:join`               | Client → Server | Join a room using its code     |
| `room:updated`            | Server → Client | Broadcast lobby state          |
| `room:update-settings`    | Client → Server | Host updates match settings    |
| `room:start-match`        | Client → Server | Host starts the match          |
| `match:started`           | Server → Client | Match begins with problem      |
| `match:typing`            | Bidirectional   | Real-time typing indicator     |
| `match:test-update`       | Client → Server | Report test-case progress      |
| `match:opponent-progress` | Server → Client | Send opponent progress         |
| `match:ended`             | Server → Client | Send match results             |
| `room:error`              | Server → Client | Send error notification        |

---

## 🚫 Anti Copy-Paste System

The Monaco Editor uses multiple layers to discourage copying and pasting code:

* **Key binding override** — Blocks `Ctrl+V` / `Cmd+V`
* **Paste event listener** — Detects paste operations and triggers undo + notification
* **DOM-level paste prevention** — Blocks paste events on the editor container
* **Context menu disabled** — Suppresses the browser/editor right-click menu

> Note: Client-side restrictions can be bypassed by a determined user. They are intended primarily to discourage casual copying rather than provide absolute protection.

---

## 🔒 Security

CodeCampus implements several security measures:

* **Helmet** — HTTP security headers
* **Rate Limiting** — 100 requests / 15 min for APIs and 200 requests / min for code execution
* **express-mongo-sanitize** — NoSQL injection prevention
* **HPP** — HTTP parameter pollution protection
* **Zod** — Request payload validation
* **bcrypt** — Secure password hashing
* **JWT** — Stateless authentication

---

## 💻 Supported Languages

| Language   | Compiler / Runtime |
| ---------- | ------------------ |
| Python     | CPython 3.14       |
| JavaScript | Node.js 20.17      |
| TypeScript | Node.js 20.17      |
| C++        | GCC 13.2           |
| C          | GCC 13.2           |
| Java       | OpenJDK 22         |
| Go         | Go 1.23            |
| Rust       | Rust 1.82          |
| C#         | Mono 6.12          |
| PHP        | PHP 8.3            |
| Ruby       | Ruby 4.0           |
| Swift      | Swift 6.0          |

Code execution is powered by **Wandbox**, a free and open-source online compiler API that does not require an API key.

---

## 🏗️ Deployment

### Production Build

From the project root:

```bash
npm run build
npm start
```

The production server runs:

* Express API
* Socket.IO
* Next.js SSR

on a single port, eliminating the need for a separate reverse proxy.

### Environment Variables

| Variable         | Required | Description                      |
| ---------------- | -------- | -------------------------------- |
| `PORT`           | No       | Server port. Default: `5000`     |
| `NODE_ENV`       | No       | `development` or `production`    |
| `MONGO_URI`      | Yes      | MongoDB connection string        |
| `REDIS_URL`      | Yes      | Redis connection string          |
| `JWT_SECRET`     | Yes      | Secret used for JWT signing      |
| `JWT_EXPIRES_IN` | No       | JWT expiration. Default: `7d`    |
| `CLIENT_URL`     | Yes      | Frontend URL used for CORS       |
| `EMAIL_USER`     | No       | Gmail address for password reset |
| `EMAIL_PASS`     | No       | Gmail app password               |

---

## 📄 License

This project is licensed under the **ISC License**.
