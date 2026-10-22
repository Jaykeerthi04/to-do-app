# Taskly: React Native To-Do App with Smart Prioritisation

A full-stack to-do app: a **React Native CLI (TypeScript)** Android app and a **Node.js + Express + MongoDB** REST API with JWT authentication.

| | |
|---|---|
| **Live API** | https://to-do-app-ntys.onrender.com/api (health check: `/health`) |
| **APK** | [Download Taskly for Android](https://github.com/Jaykeerthi04/to-do-app/releases/latest) |

> The API runs on a free Render instance, so the **first request after idle can take up to a minute** while it wakes up. The app tells the user when this happens.

## Features

**Required**
- Register and log in with email and password (bcrypt-hashed, JWT sessions, auto-login on app start, auto-logout when a token expires)
- Add tasks with title, description, due date-time, deadline and priority
- Mark tasks complete (instant, optimistic update with rollback on failure), delete tasks (with confirmation), view the list with status
- Node.js/Express API with MongoDB (Mongoose) for storage; every query is scoped to the logged-in user

**Bonus**
- **Smart sort**: a priority + time + deadline mix algorithm (details below)
- Other sorts: Deadline, Due time, Priority, Newest
- Filters: status (all / active / done / overdue), priority, category, tag; debounced text search
- Categories and tags, edit tasks, overdue and due-soon highlighting
- Dark, priority-coloured UI with empty states, pull-to-refresh and a floating add button

## Smart sort

Each task gets a score and the list is ordered by it (highest first):

```
active task:  score = priorityWeight * 10 + 100 / (hoursUntilDeadline + 1)    (high=3, medium=2, low=1)
overdue task: score = 1000 + priorityWeight * 10 + min(hoursOverdue, 72)
completed:    score = -1
```

The urgency term grows rapidly as the deadline approaches, so urgent work can outrank important-but-distant work. Overdue tasks always surface first, completed tasks sink, and ties are broken by the earlier due time.

| Task | Score |
|---|---|
| Low priority, overdue 5h | 1015.0 |
| Low priority, due in 1h | 60.0 |
| Medium priority, due in 1 day | 24.0 |
| High priority, due in 7 days | 30.6 |
| Completed task | -1 |

A low-priority task due in an hour outranks a high-priority task due next week. Switch to **Priority** sort to compare.

## Tech stack

| Layer | Choice |
|---|---|
| App | React Native CLI, TypeScript, React Navigation (native stack) |
| State | Redux Toolkit (auth and tasks slices, async thunks, typed hooks) |
| Networking | Axios with a JWT interceptor and central error handling |
| Persistence | AsyncStorage (session token) |
| API | Node.js, Express, TypeScript, Mongoose, Zod validation, JWT, bcryptjs |
| Database | MongoDB Atlas |
| Hosting | Render |

## Repository layout

```
/              Express + Mongoose API (src/, package.json) at the repo root
frontend/      React Native app
  App.tsx
  src/
    api/          axios client and endpoint wrappers
    store/        Redux slices and typed hooks
    navigation/   auth stack vs app stack
    screens/      Login, Register, Tasks, TaskForm
    components/   Button, TextField, Chip, TaskCard
    utils/        date helpers, token storage
```

## Run it locally

**Backend** (from the repo root)
```bash
npm install
cp .env.example .env      # set MONGODB_URI and JWT_SECRET
npm run dev               # http://localhost:4000
```

**App** (Android SDK and a device or emulator required)
```bash
cd frontend
npm install
npx react-native run-android
```
By default the app talks to the deployed API. To use a local backend, edit `frontend/src/config.ts` to `http://10.0.2.2:4000/api` (Android emulator) and allow cleartext HTTP.

## API summary

All `/api/tasks*` routes require `Authorization: Bearer <token>`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register` | create account |
| POST | `/api/auth/login` | log in |
| GET | `/api/auth/me` | current user |
| GET | `/api/tasks` | list; query: `status`, `priority`, `category`, `tag`, `search`, `sort` |
| POST | `/api/tasks` | create |
| PATCH | `/api/tasks/:id` | update |
| PATCH | `/api/tasks/:id/toggle` | toggle completed |
| DELETE | `/api/tasks/:id` | delete |
| GET | `/api/tasks/meta` | categories and tags for filter chips |

## Deployment (Render + MongoDB Atlas)

1. Create an Atlas cluster and database user, and allow network access (`0.0.0.0/0`).
2. On Render create a **Web Service** from this repo: build `npm install && npm run build`, start `npm start`.
3. Set environment variables `MONGODB_URI`, `JWT_SECRET` and `JWT_EXPIRES_IN=7d`. Health check path: `/health`.

## Design decisions

- **Sorting on the server.** The smart score is computed in the API and returned with each task, so the logic lives in one tested place and any client gets the same order.
- **Optimistic toggle, confirmed delete.** Completing a task feels instant, while destructive actions wait for the server.
- **Out-of-order response guard.** Fast filter changes can't show stale results, because each list request is tagged and old responses are ignored.
- **Validation on both sides.** The app mirrors the server's rules (email format, password strength, deadline not before due time) for instant feedback, and the server is the source of truth.
- **Cold-start friendly.** A long request timeout and clear loading messages make the free hosting tier usable.