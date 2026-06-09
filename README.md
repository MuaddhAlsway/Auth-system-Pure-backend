# Auth Backend

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT" />
  <img src="https://img.shields.io/badge/Turso-4FF8D2?style=for-the-badge&logo=turso&logoColor=black" alt="Turso" />
</p>

A pure Node.js/Express REST API for JWT-based authentication with role-based access control, backed by [Turso](https://turso.tech) (libSQL).

---

## Tech Stack

| Package | Purpose |
|---|---|
| Express 5 | HTTP server and routing |
| jsonwebtoken | Access + refresh token signing |
| bcryptjs | Password hashing |
| @libsql/client | Turso (libSQL) database client |
| cookie-parser | Read `refreshToken` from HTTP-only cookies |
| helmet | Security headers |
| cors | Cross-origin request handling |
| dotenv | Environment variable loading |

---

## Project Structure

```
src/
├── server.js              # Entry point, starts HTTP server
├── app.js                 # Express app setup, middleware, routes
├── controllers/
│   └── authController.js  # register, login, refresh logic
├── db/
│   └── client.js          # Turso DB client (lazy-initialized)
├── middleware/
│   ├── authMiddleware.js   # JWT verification (protect)
│   └── roleMiddleware.js   # Role-based access (authorizeRoles)
├── routes/
│   └── authRoutes.js       # All /api/auth routes
└── utils/
    └── tokens.js           # generateAccessToken, generateRefreshToken
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
PORT=5000
```

> Get your Turso URL and token from [turso.tech](https://turso.tech) → your database → "Connect".

### 3. Create the users table in Turso

Run this SQL in the Turso shell (`turso db shell <db-name>`) or via the Turso dashboard:

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  refresh_token TEXT
);
```

### 4. Start the server

```bash
node src/server.js
```

Server runs on `http://localhost:5000` by default.

---

## API Reference

Base URL: `http://localhost:5000/api/auth`

---

### POST `/register`

Register a new user. Returns an access token and sets a `refreshToken` cookie.

**Request body:**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

**Response `200`:**
```json
{
  "accessToken": "<jwt>"
}
```

**Response `400`** — user already exists:
```json
{ "message": "User already exists" }
```

**curl example:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```

---

### POST `/login`

Login with email and password. Returns an access token and sets a `refreshToken` cookie.

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
  "accessToken": "<jwt>"
}
```

**Response `400`** — wrong credentials:
```json
{ "message": "Invalid credentials" }
```

**curl example:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

### POST `/refresh`

Get a new access token using the `refreshToken` cookie.

**Requires:** `refreshToken` cookie (set automatically on login/register).

**Response `200`:**
```json
{
  "accessToken": "<new_jwt>"
}
```

**Response `401`** — no cookie present:
```json
{ "message": "No refresh token" }
```

**Response `403`** — token invalid or expired:
```json
{ "message": "Refresh token expired or invalid" }
```

**curl example:**
```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  --cookie "refreshToken=<your_refresh_token>"
```

---

### GET `/profile`

Returns the authenticated user's decoded token payload.

**Requires:** `Authorization: Bearer <accessToken>` header.

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
{ "message": "Not authorized" }
```

**curl example:**
```bash
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer <accessToken>"
```

---

### GET `/admin`

Admin-only protected route.

**Requires:** `Authorization: Bearer <accessToken>` header. User must have `role: "admin"`.

**Response `200`:**
```json
{ "message": "Admin access" }
```

**Response `403`** — not an admin:
```json
{ "message": "Access denied" }
```

**curl example:**
```bash
curl http://localhost:5000/api/auth/admin \
  -H "Authorization: Bearer <accessToken>"
```

---

## Auth Flow

```
1. POST /register or /login
   → server returns accessToken (15m expiry)
   → server sets refreshToken cookie (7d expiry, httpOnly)

2. Use accessToken in Authorization header for protected routes

3. When accessToken expires → POST /refresh
   → server reads refreshToken cookie
   → returns new accessToken
```

---

## Token Details

| Token | Secret env var | Expiry | Transport |
|---|---|---|---|
| Access Token | `ACCESS_TOKEN_SECRET` | 15 minutes | `Authorization: Bearer` header |
| Refresh Token | `REFRESH_TOKEN_SECRET` | 7 days | `httpOnly` cookie |

Tokens carry `{ id, role }` as payload.

---

## Roles

| Role | Access |
|---|---|
| `user` | `/profile` |
| `admin` | `/profile`, `/admin` |

Users are assigned `role: "user"` on registration. To make a user admin, update the `role` column directly in Turso.

---

## Security Notes

- Passwords are hashed with bcrypt (10 salt rounds)
- Refresh tokens are stored in the database and validated on each use
- `httpOnly` cookies prevent JavaScript access to the refresh token
- Helmet sets secure HTTP headers on all responses
- CORS is restricted to `CLIENT_URL` (set in `.env`)
