# CRM: HUDCO Internal Workspace

An internal task management, calendar, to-do, and chat platform for HUDCO's admin and employee teams.

Admins create accounts and assign tasks (with deadlines and subtasks) to one or more employees. Employees track and complete their work from a shared dashboard. Deadlines appear on a month calendar, personal to-dos stay private, and a real-time chat connects everyone through direct messages and group chats, with file sharing. The whole app works on phones as well as desktops.

---

## Features

**Accounts and access**
- Accounts are created by admins only. There is no public registration.
- Two roles: `employee` and `admin`. Admins can promote or demote others from the Manage Users page, but not themselves.
- Passwords are hashed with bcrypt (minimum 6 characters). Sessions use JWT, persist across browser restarts, and log the user out automatically when they become invalid.

**Tasks**
- Admins create tasks with a title, description, and deadline, and assign them to one or more employees.
- Tasks can have subtasks, each assigned to a specific employee.
- Assigned employees can tick off a whole task, or their own subtasks. A task is marked done automatically when all of its subtasks are done.
- Search by task title. Admins can delete tasks.
- Employees receive an email when a task is assigned to them.

**Calendar**
- A month-grid calendar showing task deadlines and personal to-do due dates, colour-coded (upcoming, overdue, done, personal to-do).
- Tap or click a day to see everything due on it. Admins see the whole team's deadlines.

**Personal to-dos**
- A private to-do list per user, with optional due dates, separate from assigned tasks.

**Chat**
- Real-time direct messages between any two users, and group chats (the creator plus at least two others).
- Send images and files up to 1 MB (images, PDF, plain text, CSV, and Word, Excel, and PowerPoint documents).
- Read/unread tracking with per-conversation badges and a total on the sidebar.
- Search for people and conversations. A group can be deleted by its creator or any admin.
- People who are offline get one email per unread streak ("You've got unread messages"). Emails never contain message text.
- Messages older than 6 months are deleted automatically (configurable).

**Admin tools**
- Manage Users: create accounts, promote employees to admin, demote admins.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS v4, React Router, Axios |
| Backend | Node.js, Express |
| Database | MySQL via Prisma 7 |
| Real-time | Socket.IO |
| Auth | JWT, bcrypt |
| Uploads, email, scheduling | multer, nodemailer, node-cron |

---

## Getting started

### Prerequisites

- Node.js 22 or later
- MySQL 8.0 or later, running locally or reachable through a connection string
- Git

### 1. Clone the repository

```bash
git clone https://github.com/KanishqVerma/crm-hudco.git
cd crm-hudco
```

### 2. Set up the backend

```bash
cd server
npm install
cp .env.example .env
```

Open `.env` and fill in at least `DATABASE_URL` (an existing, empty MySQL database) and `JWT_SECRET` (a long random string). Then create the tables:

```bash
npx prisma migrate deploy
npx prisma generate
```

> Run Prisma commands from inside the `server` folder. Running them elsewhere can download a different Prisma version than the one this project uses.

### 3. Create the first admin

With no public registration, the first admin is created from the command line:

```bash
node scripts/createAdmin.js "Full Name" admin@example.com yourpassword
```

Separate the three values with spaces only, with no commas. From there, log in and create all other accounts from the Manage Users page.

### 4. Start the backend

```bash
node index.js
```

The API runs at `http://localhost:5000`.

### 5. Set up and start the frontend

In a second terminal:

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

The app runs at `http://localhost:5173`. Both servers must be running at the same time.

### 6. Optional: email notifications

Add the SMTP settings from `.env.example` to `server/.env`, then check them:

```bash
node scripts/testEmail.js you@example.com
```

If `SMTP_HOST` is not set, the app runs normally with email switched off. Gmail (with an app password), a transactional email service, or your organisation's own mail server all work.

---

## Configuration

**`server/.env`**

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | MySQL connection string |
| `JWT_SECRET` | Yes | Secret used to sign login tokens |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | No | Mail server settings. Omit `SMTP_HOST` to disable email |
| `MAIL_FROM` | No | Sender shown on emails |
| `APP_URL` | No | Address linked in emails. Set it to the real address after deploying |
| `CHAT_RETENTION_MONTHS` | No | How long chat history is kept (default 6) |

**`client/.env`**

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API address, for example `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | Backend address for Socket.IO, for example `http://localhost:5000` |

---

## Project structure

```
crm-hudco/
├── server/
│   ├── prisma/
│   │   ├── schema.prisma      Database schema
│   │   └── migrations/        Migration history
│   ├── routes/                API routes (auth, tasks, todos, calendar, users, chat)
│   ├── middleware/            Authentication and admin checks
│   ├── services/              Message delivery, email, notifications, chat retention
│   ├── scripts/               createAdmin.js, testEmail.js
│   └── index.js               Entry point (Express + Socket.IO)
│
└── client/
    └── src/
        ├── pages/             Login, Tasks, Calendar, Todos, Chat, Admin
        ├── components/        Layout (sidebar and mobile menu)
        ├── context/           Auth, Socket, and unread-count state
        └── api/               Axios instance
```

---

## Database

Tables use the prefix `tbl_crm_`: `user`, `task`, `task_assignee`, `subtask`, `todo`, `conversation`, `conversation_participant`, `message`, and `attachment`.

- To bring any database up to date, point `DATABASE_URL` at it and run `npx prisma migrate deploy`.
- Uploaded files are stored in the database (in `tbl_crm_attachment`), not on disk. Deleting a message, or the 6-month cleanup, removes its file too.
- **Renaming a table with real data:** changing a model's `@@map` name makes Prisma drop and recreate the table, which deletes the data. If a rename is ever needed on a database with real data, generate the migration with `npx prisma migrate dev --create-only` and edit the SQL to use `RENAME TABLE` before applying it.

---

## API overview

All routes except login require an `Authorization: Bearer <token>` header.

| Area | Base path | Notes |
|---|---|---|
| Auth | `/api/auth` | Login is public. Creating accounts (`/register`) is admin-only |
| Tasks | `/api/tasks` | Create and delete are admin-only. Assignees update status |
| To-dos | `/api/todos` | Owner-only |
| Calendar | `/api/calendar` | Read-only, built from task deadlines |
| Users | `/api/users` | Admin-only listing and role changes. `/colleagues` is open to all users |
| Chat | `/api/chat` | Conversations, groups, messages, attachments |
| Socket.IO | server root | Live message delivery. Connections require a valid token |

---

## Roles and permissions

| Action | Employee | Admin |
|---|---|---|
| See tasks | Own assigned tasks | All tasks |
| Create and delete tasks | No | Yes |
| Complete assigned tasks and own subtasks | Yes | Yes |
| Personal to-dos | Yes | Yes |
| Direct and group chat, file sharing | Yes | Yes |
| Delete a group | Groups they created | Any group |
| Create accounts | No | Yes |
| Promote or demote users | No | Yes (not themselves) |

---

## Security notes

- Passwords are hashed. Login tokens expire after 7 days.
- Chat messages and files are only delivered to, and downloadable by, members of that conversation. This is enforced on the server, including for live socket messages.
- Messages and files are stored in the database unencrypted, so anyone with database access can read them. There is no end-to-end encryption.
- The upload type check relies on the file type the browser reports.
- CORS currently allows any origin. Restrict it to the frontend's address before going live.

---

## Deploying

- **Backend:** needs Node.js 22+, a process manager such as `pm2` to keep it running, and a reverse proxy such as `nginx` that forwards both normal requests and WebSocket traffic, with HTTPS. The backend must be able to reach the database.
- **Frontend:** run `npm run build` in `client` and serve `client/dist` as static files. Vite bakes the `VITE_` variables in at build time, so set them to the live backend address before building.
- Set `APP_URL` so email links point at the live site.
- Run `npx prisma migrate deploy` against the production database, and back the database up regularly, since it also holds uploaded files.

---

<!-- ## Known limitations

- No way to change your own password. Admins set the initial password when creating an account.
- Tasks cannot be edited after creation, only deleted.
- Group members cannot be added, removed, or leave after a group is created.
- A new group appears for other members after its first message (or a refresh).
- No email reminders for approaching deadlines.
- Files are limited to 1 MB. -->

## License

Internal project, HUDCO.