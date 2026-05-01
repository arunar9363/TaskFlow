# TaskFlow — Enterprise Team Task Management

A production-ready, full-stack task management application built with the MERN stack. Designed with a clean, custom B&W SaaS aesthetic inspired by Linear and Notion.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Context API |
| Backend | Node.js, Express 4 |
| Database | MongoDB + Mongoose ODM |
| Auth | JWT (Access + Refresh token rotation) |
| Validation | express-validator |
| Security | bcryptjs, helmet, express-rate-limit |
| Logging | winston |
| Deployment | Railway (backend + frontend) |

---

## Features

### Authentication
- JWT access tokens (15m expiry) + refresh tokens (7d, stored in httpOnly cookie)
- Refresh token rotation with reuse detection
- Role-based access control (Admin / Member)
- Password hashing with bcrypt (cost factor 12)

### Projects
- Create/edit/delete projects (Admin only)
- Add/remove members per project
- Project status: Active / Completed / Archived

### Tasks
- Full CRUD with title, description, priority, due date, assignee, tags
- Status: Todo / In Progress / Done
- Overdue detection (virtual field)
- Kanban board + list view
- Members can only update status of their assigned tasks

### Dashboard
- Summary stats (total, in-progress, done, overdue)
- Donut chart (status breakdown)
- Bar chart (priority distribution)
- Completion rate ring
- Workload per user
- Recent task feed

### Admin Panel
- User management (edit role, toggle active, delete)
- Global project and task visibility

---

## Project Structure

```
taskflow/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   ├── projectController.js
│   │   ├── taskController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── validate.js
│   ├── models/
│   │   ├── Project.js
│   │   ├── Task.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── index.js
│   │   ├── projects.js
│   │   └── tasks.js
│   ├── utils/
│   │   ├── apiResponse.js
│   │   ├── jwt.js
│   │   └── logger.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── auth/
    │   │   │   └── RouteGuards.jsx
    │   │   ├── tasks/
    │   │   │   └── TaskBoard.jsx
    │   │   └── ui/
    │   │       ├── Toast.jsx
    │   │       └── index.jsx
    │   ├── context/
    │   │   ├── AppContext.jsx
    │   │   └── AuthContext.jsx
    │   ├── layouts/
    │   │   └── AppLayout.jsx
    │   ├── pages/
    │   │   ├── admin/AdminUsersPage.jsx
    │   │   ├── auth/AuthPages.jsx
    │   │   ├── dashboard/DashboardPage.jsx
    │   │   ├── projects/
    │   │   │   ├── ProjectDetailPage.jsx
    │   │   │   └── ProjectsPage.jsx
    │   │   └── tasks/TasksPage.jsx
    │   ├── services/
    │   │   ├── api.js
    │   │   └── index.js
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    ├── .env.example
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js
```

---

## Local Setup

### Prerequisites
- Node.js >= 18.x
- MongoDB (local or Atlas)
- npm >= 9.x

### 1. Clone / Extract the project

```bash
unzip taskflow.zip
cd taskflow
```

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taskflow
JWT_ACCESS_SECRET=your_super_secret_access_key_64_chars_min
JWT_REFRESH_SECRET=your_super_secret_refresh_key_64_chars_min
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

```bash
npm run dev
```

Backend runs at: `http://localhost:5000`

### 3. Frontend setup

```bash
cd ../frontend
npm install
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

Frontend runs at: `http://localhost:5173`

### 4. Create your first Admin account

Register at `http://localhost:5173/register` and select **Admin** as your role. Subsequent users will default to **Member**.

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register |
| POST | `/api/auth/login` | — | Login |
| POST | `/api/auth/refresh` | Cookie | Refresh access token |
| POST | `/api/auth/logout` | Bearer | Logout |
| GET | `/api/auth/me` | Bearer | Current user |

### Projects
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/projects` | Any | List accessible projects |
| POST | `/api/projects` | Admin | Create project |
| GET | `/api/projects/:id` | Member | Get project details |
| PUT | `/api/projects/:id` | Admin/Owner | Update project |
| DELETE | `/api/projects/:id` | Admin | Delete project + tasks |
| POST | `/api/projects/:id/members` | Admin | Add member |
| DELETE | `/api/projects/:id/members/:userId` | Admin | Remove member |

### Tasks
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/tasks` | Any | List tasks (filtered) |
| POST | `/api/tasks` | Admin/Owner | Create task |
| GET | `/api/tasks/:id` | Member | Get task |
| PUT | `/api/tasks/:id` | Admin/Assignee | Update task |
| DELETE | `/api/tasks/:id` | Admin | Delete task |

### Dashboard
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/dashboard/stats` | Bearer | Aggregated stats |

### Users (Admin only)
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/users` | Admin | List users |
| GET | `/api/users/:id` | Any | Get user |
| PUT | `/api/users/:id` | Admin | Update user |
| DELETE | `/api/users/:id` | Admin | Delete user |

---

## Deployment on Railway

### Backend

1. Create a new Railway project
2. Add a **MongoDB** plugin or use MongoDB Atlas
3. Connect your GitHub repo or push via CLI
4. Set environment variables in Railway dashboard (copy from `.env.example`)
5. Set **Start Command**: `npm start`
6. Set **Root Directory**: `backend`

### Frontend

1. Create another Railway service (or use Vercel/Netlify)
2. Set **Root Directory**: `frontend`
3. Set **Build Command**: `npm run build`
4. Set **Start Command**: `npx serve -s dist -l $PORT`
5. Set `VITE_API_URL` to your deployed backend URL

### CORS

Update `CLIENT_URL` in backend `.env` to your deployed frontend URL.

---

## Security Highlights

- Passwords hashed with bcrypt (cost 12)
- JWTs signed with separate secrets for access/refresh
- Refresh token rotation — reuse triggers full token revocation
- Rate limiting: 100 req/15min globally, 10 req/15min on auth routes
- HTTP-only cookies for refresh tokens (XSS resistant)
- Helmet.js for HTTP security headers
- Input validation on all routes via express-validator
- Role-based middleware on every protected endpoint

---

## Build ZIP

```bash
# From root of taskflow/
npm run zip
# or manually:
zip -r taskflow.zip . --exclude "*/node_modules/*" --exclude "*/.git/*" --exclude "*/logs/*"
```

---

## License

MIT — Built for production use by TaskFlow Engineering.
