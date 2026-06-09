# Stripe System Backend

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT" />
  <img src="https://img.shields.io/badge/Turso-4FF8D2?style=for-the-badge&logo=turso&logoColor=black" alt="Turso" />
  <a href="https://app.notion.com/p/Advanced-Auth-Architecture-37ae97a262dc809e84f3ee12e43f8c54?source=copy_link">
    <img src="https://img.shields.io/badge/Notion-000000?style=for-the-badge&logo=notion&logoColor=white" alt="Notion Docs" />
  </a>
</p>

A modular Node.js/Express authentication backend with JWT access/refresh tokens, role-based permissions, session tracking, and audit logging — backed by [Turso](https://turso.tech) (libSQL).

---

## Tech Stack

| Package | Purpose |
|---|---|
| Express 4 | HTTP server and routing |
| jsonwebtoken | Access + refresh token signing |
| bcrypt | Password hashing |
| @libsql/client | Turso (libSQL) HTTP client |
| cookie-parser | Read `refreshToken` from HTTP-only cookies |
| helmet | Security headers |
| cors | Cross-origin request handling |
| uuid | UUID generation for IDs |
| dotenv | Environment variable loading |

---

## Project Structure

```
src/
├── server.js                        # Entry point — binds HTTP port
├── app.js                           # Express setup, global middleware, routes
├── db/
│   ├── client.js                    # Lazy-init Turso HTTP client (singleton + Proxy)
│   └── schema.sql                   # Full database schema
├── middleware/
│   ├── auth.middleware.js           # JWT verification guard
│   └── error.middleware.js          # Global error handler
├── modules/
│   ├── auth/
│   │   ├── auth.controller.js       # HTTP handlers (register, login)
│   │   ├── auth.service.js          # Business logic (hash, token, persist)
│   │   ├── auth.repository.js       # DB queries for refresh_tokens table
│   │   └── auth.routes.js           # Route definitions
│   ├── user/
│   │   └── user.repository.js       # DB queries for users table
│   ├── session/
│   │   └── session.repository.js    # DB queries for sessions table
│   ├── audit/
│   │   └── audit.repository.js      # DB queries for audit_logs table
│   └── permission/
│       └── permission.repository.js # DB queries for permissions table
└── utils/
    └── jwt.js                       # generateAccessToken, generateRefreshToken
```

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```env
TURSO_DATABASE_URL=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token

ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret

CLIENT_URL=http://localhost:3000
PORT=5001
```

Generate strong secrets with:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

> Run it twice — once for `ACCESS_TOKEN_SECRET`, once for `REFRESH_TOKEN_SECRET`.

### 3. Run the database schema

In the Turso shell (`turso db shell <db-name>`) or dashboard, execute `src/db/schema.sql`:

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  verified INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at DATETIME NOT NULL
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  device_name TEXT,
  ip_address TEXT,
  refresh_token_hash TEXT,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE role_permissions (
  role TEXT NOT NULL,
  permission_id TEXT NOT NULL
);
```

### 4. Start the server

```bash
node src/server.js
```

Server runs on `http://localhost:5001` by default.

For development with auto-restart:
```bash
npm run dev
```

---

## API Reference

Base URL: `http://localhost:5001/api/auth`

---

### GET `/`

Health check.

**Response `200`:**
```json
{ "status": "ok" }
```

---

### POST `/api/auth/register`

Register a new user. Returns an access token in the body and sets an `httpOnly` refresh token cookie.

**Request body:**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Response `201`:**
```json
{
  "accessToken": "<jwt>",
  "user": {
    "id": "uuid",
    "email": "test@example.com"
  }
}
```

**Response `400`** — email already registered:
```json
{ "message": "User already exists" }
```

**curl:**
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

### POST `/api/auth/login`

Login with email and password.

**Request body:**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Response `200`:**
```json
{
  "accessToken": "<jwt>",
  "user": {
    "id": "uuid",
    "email": "test@example.com"
  }
}
```

**Response `400`** — wrong credentials:
```json
{ "message": "Invalid credentials" }
```

**curl:**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

### GET `/api/auth/me`

Returns the current user's decoded token payload. Requires authentication.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response `200`:**
```json
{
  "id": "uuid",
  "role": "user",
  "iat": 1234567890,
  "exp": 1234568790
}
```

**Response `401`** — missing or invalid token:
```json
{ "message": "Invalid token" }
```

**curl:**
```bash
curl http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

---

## Auth Flow

```
1. POST /register or /login
   → accessToken returned in body (15m expiry)
   → refreshToken set as httpOnly cookie (7d expiry)

2. Attach accessToken to protected requests:
   Authorization: Bearer <accessToken>

3. When accessToken expires → POST /refresh (coming soon)
   → server reads refreshToken cookie
   → validates against refresh_tokens table
   → returns new accessToken
```

---

## Token Details

| Token | Secret | Expiry | Storage |
|---|---|---|---|
| Access Token | `ACCESS_TOKEN_SECRET` | 15 minutes | `Authorization` header |
| Refresh Token | `REFRESH_TOKEN_SECRET` | 7 days | `httpOnly` cookie + DB |

Payload: `{ id, role }`

---

## Database Schema Overview

| Table | Purpose |
|---|---|
| `users` | Core user accounts |
| `refresh_tokens` | Issued refresh tokens (enables revocation) |
| `sessions` | Device/IP session tracking |
| `audit_logs` | Action history per user |
| `permissions` | Named permission definitions |
| `role_permissions` | Maps roles to permissions |

---

## Security Notes

- Passwords hashed with bcrypt (cost 10)
- Refresh tokens stored in DB — can be revoked server-side
- `httpOnly` + `SameSite: strict` cookies prevent XSS token theft
- Helmet sets secure HTTP response headers
- CORS restricted to `CLIENT_URL`
- `secure: true` automatically enabled in production (`NODE_ENV=production`)
