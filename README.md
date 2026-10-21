# To-Do Backend (Node + Express + TypeScript + MongoDB)

REST API for the React Native To-Do app. JWT auth, per-user tasks, smart sorting, filters, categories and tags.

## Run locally
```bash
npm install
cp .env.example .env      # set MONGODB_URI and JWT_SECRET
npm run dev               # http://localhost:4000
```
From the Android emulator the API is at `http://10.0.2.2:4000/api`.

## Endpoints
All `/api/tasks*` routes need `Authorization: Bearer <token>`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register` | `{ name?, email, password }` -> `{ token, user }` |
| POST | `/api/auth/login` | `{ email, password }` -> `{ token, user }` |
| GET | `/api/auth/me` | current user |
| GET | `/api/tasks` | list (see query params) |
| POST | `/api/tasks` | create |
| GET | `/api/tasks/:id` | one task |
| PATCH | `/api/tasks/:id` | partial update |
| PATCH | `/api/tasks/:id/toggle` | flip completed |
| DELETE | `/api/tasks/:id` | delete (204) |
| GET | `/api/tasks/meta` | `{ categories, tags }` for filter chips |

**Task body:** `title`, `description?`, `dueAt` (ISO date-time), `deadline` (ISO, >= dueAt), `priority?` (`low|medium|high`), `category?`, `tags?` (string[])

**List query params:** `status=all|active|completed|overdue`, `priority`, `category`, `tag`, `search`, `sort=smart|deadline|due|priority|newest`

## Smart sort (time + deadline + priority mix)
```
active:    score = priorityWeight*10 + 100 / (hoursUntilDeadline + 1)     (high=3, medium=2, low=1)
overdue:   score = 1000 + priorityWeight*10 + min(hoursOverdue, 72)
completed: score = -1
```
Urgency grows hyperbolically near the deadline, so a low-priority task due in an hour can beat a high-priority one due next week. Overdue tasks always surface first; completed tasks sink. Ties break by earlier `dueAt`. Each task in the list response includes its `smartScore`.

## Quick test (curl)
```bash
curl -X POST localhost:4000/api/auth/register -H "Content-Type: application/json" \
  -d '{"email":"a@b.com","password":"secret123"}'
curl -X POST localhost:4000/api/tasks -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Ship assignment","dueAt":"2026-10-22T09:00:00Z","deadline":"2026-10-22T18:00:00Z","priority":"high","category":"Work","tags":["urgent"]}'
curl "localhost:4000/api/tasks?sort=smart&status=active" -H "Authorization: Bearer $TOKEN"
```

## Deploy (Render + MongoDB Atlas)
1. Create a free Atlas cluster, a database user, and allow `0.0.0.0/0` in Network Access. Copy the connection string.
2. Push this folder to GitHub. On Render create a **Web Service**: build `npm install && npm run build`, start `npm start`.
3. Add env vars `MONGODB_URI`, `JWT_SECRET` (long random string), `JWT_EXPIRES_IN=7d`.
4. Health check path: `/health`. Your API base URL is `https://<service>.onrender.com/api`.
