# CRM — HUDCO Internal Workspace

An internal task management, calendar, to-do, and real-time chat platform built for HUDCO's admin and employee teams.

Admins assign tasks with deadlines and subtasks to one or more employees, who track and complete their work through a shared dashboard. Deadlines automatically surface on a calendar, personal to-dos stay private per employee, and a real-time chat system connects admins and employees (or employees with each other) securely.

---

## Features

**Authentication & Access Control**
- Secure login/registration with hashed passwords and JWT-based sessions
- Role-based access: `employee` and `admin`
- Public registration always creates employee accounts — admin access can only be granted by an existing admin, through a dedicated in-app panel
- Sessions persist across browser restarts, with automatic logout if a session becomes invalid or expires

**Task Management**
- Admins create tasks with a title, description, and deadline
- Tasks can be assigned to multiple employees at once
- Tasks support subtasks, each individually assignable to a specific employee
- Employees can check off their own subtasks, or mark an entire task complete directly
- A task's overall status automatically reflects its subtasks' completion
- Search by task title
- Admins can delete tasks

**Calendar**
- A real month-grid calendar view (not just a list) — navigate between months
- Task deadlines and personal to-do due dates both appear on the grid, color-coded by status (upcoming, overdue, done, personal to-do)
- Clicking an item jumps straight to the relevant Tasks or To-Dos page

**Personal To-Dos**
- Private, per-employee to-do list, fully separate from assigned tasks
- Full create/complete/delete functionality with optional due dates

**Real-Time Chat**
- Secure one-on-one messaging between any two users (admin↔employee or employee↔employee)
- Instant delivery via Socket.IO — no page refresh needed
- Read/unread tracking, with unread counts shown per conversation and a global badge in the sidebar
- Search to quickly find a person or an existing conversation

**Admin Tools**
- A dedicated "Manage Users" panel to promote employees to admin or demote admins back to employee
- Admins cannot change their own role (prevents accidental lockout)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS, React Router |
| Backend | Node.js, Express |
| Database | MySQL, via Prisma ORM |
| Real-time | Socket.IO |
| Auth | JWT, bcrypt |

---

## Prerequisites

- **Node.js** v22 or later
- **MySQL Server** (8.0+) — either running locally, or a connection string to a hosted instance (e.g., Aiven)
- **Git**

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/KanishqVerma/crm-hudco.git
cd crm-hudco
```

### 2. Backend setup

```bash
cd server
npm install
```

Copy the example environment file and fill in your real values:

```bash
cp .env.example .env
```

Edit `.env`:
DATABASE_URL, JWT_SECRET


Apply the database schema:

```bash
npx prisma migrate deploy
npx prisma generate
```

Start the backend:

```bash
node index.js
```

The API runs at `http://localhost:5000`.

### 3. Frontend setup

In a **second terminal**:

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

The app runs at `http://localhost:5173`.

> Both the backend and frontend need to be running at the same time, in separate terminals, for the app to work.

### 4. Create your first account

Register through the app's Register page — every public registration is created as an `employee`.

To create your first **admin** account, do one of the following:
- Update a user's `role` column directly to `admin` using Prisma Studio (`npx prisma studio`, inside `server`), or
- If you already have an admin, promote someone through the in-app **Manage Users** page

---

## Environment Variables

**`server/.env`**

| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL connection string |
| `JWT_SECRET` | Secret key used to sign and verify login tokens |

**`client/.env`**

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API (e.g., `http://localhost:5000/api`) |
| `VITE_SOCKET_URL` | Base URL of the backend for Socket.IO (e.g., `http://localhost:5000`) |

---

## Project Structure
crm-hudco/
├── server/ # Express backend
│ ├── prisma/
│ │ ├── schema.prisma # Database schema
│ │ └── migrations/ # Migration history
│ ├── routes/ # API route handlers
│ ├── middleware/ # Auth middleware
│ └── index.js # Entry point (Express + Socket.IO)
│
└── client/ # React frontend
└── src/
├── pages/ # Route-level pages (Login, Tasks, Calendar, etc.)
├── components/ # Shared components (Layout/sidebar)
├── context/ # Auth, Socket, and Unread-count state
└── api/ # Axios instance


---

## API Overview

All protected routes require an `Authorization: Bearer <token>` header.

| Area | Base path | Notes |
|---|---|---|
| Auth | `/api/auth` | Register, login |
| Tasks | `/api/tasks` | CRUD, assignment, subtasks — admin/employee scoped |
| To-Dos | `/api/todos` | Personal, owner-only CRUD |
| Calendar | `/api/calendar` | Read-only, derived from task deadlines |
| Users | `/api/users` | Admin-only listing, role promotion |
| Chat | `/api/chat` | Conversations and message history |
| Socket.IO | — | Real-time message delivery, connects at the server root |

---

## Roles & Permissions

| Action | Employee | Admin |
|---|---|---|
| View own assigned tasks | ✅ | ✅ (all tasks) |
| Create/delete tasks | ❌ | ✅ |
| Check off own subtasks/tasks | ✅ | ✅ |
| Manage personal to-dos | ✅ | ✅ |
| Chat with anyone | ✅ | ✅ |
| Promote/demote user roles | ❌ | ✅ (not on own account) |

---

## Known Limitations

- No file/image attachments on tasks or chat messages yet
- No email notifications for deadlines or new messages
- Chat is currently one-on-one only; no group conversations

## License

Internal project — HUDCO.
