<!-- # CRM — HUDCO Internal Tool 
A task management, calendar, to-do, and chat platform for admins and employees. 

## Tech stack
Frontend: React (Vite) + Tailwind CSS
Backend: Express + Prisma + MySQL
Real-time: Socket.IO 

## Prerequisites
Node.js v22+
MySQL Server (8.0+) running locally, or a connection string to a hosted MySQL instance 

## Setup 
### 1. Clone the repo 
```git clone https://github.com/KanishqVerma/crm-hudco```
```cd crm-hudco ``` 
### 2. Backend setup 
```cd server npm install``` 
Copy `.env.example` to `.env` and fill in your real database connection string and a JWT secret: ``` cp .env.example .env ```
Run database migrations: ```npx prisma migrate deploy npx prisma generate``` 
Start the backend: ```node index.js``` 
Server runs at `http://localhost:5000`. 
### 3. Frontend setup Open a second terminal: 
```cd client npm install``` 
Copy `.env.example` to `.env` (defaults should work for local use): ```cp .env.example .env``` Start the frontend: ``` npm run dev ``` App runs at `http://localhost:5173`. ### 4. Create your first account Register through the app's Register page — all public registrations are created as `employee` by default. To create an admin, either: - Update a user's `role` directly in the database (via Prisma Studio: `npx prisma studio`), or - Have an existing admin promote them via the in-app "Manage Users" page ## Notes - Both the backend (`node index.js`) and frontend (`npm run dev`) need to be running simultaneously in separate terminals. - Chat requires Socket.IO, which runs on the same backend server — no separate setup needed.  -->

# CRM — HUDCO Internal Tool A task management, calendar, to-do, and chat platform for admins and employees. ## Tech stack - Frontend: React (Vite) + Tailwind CSS - Backend: Express + Prisma + MySQL - Real-time: Socket.IO ## Prerequisites - Node.js v22+ - MySQL Server (8.0+) running locally, or a connection string to a hosted MySQL instance ## Setup ### 1. Clone the repo ``` git clone https://github.com/KanishqVerma/crm-hudco.git cd crm-hudco ``` ### 2. Backend setup ``` cd server npm install ``` Copy `.env.example` to `.env` and fill in your real database connection string and a JWT secret: ``` cp .env.example .env ``` Run database migrations: ``` npx prisma migrate deploy npx prisma generate ``` Start the backend: ``` node index.js ``` Server runs at `http://localhost:5000`. ### 3. Frontend setup Open a second terminal: ``` cd client npm install ``` Copy `.env.example` to `.env` (defaults should work for local use): ``` cp .env.example .env ``` Start the frontend: ``` npm run dev ``` App runs at `http://localhost:5173`. ### 4. Create your first account Register through the app's Register page — all public registrations are created as `employee` by default. To create an admin, either: - Update a user's `role` directly in the database (via Prisma Studio: `npx prisma studio`), or - Have an existing admin promote them via the in-app "Manage Users" page ## Notes - Both the backend (`node index.js`) and frontend (`npm run dev`) need to be running simultaneously in separate terminals. - Chat requires Socket.IO, which runs on the same backend server — no separate setup needed. 