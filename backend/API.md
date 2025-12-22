# API Documentation - 42 Transcendence Backend

This document provides comprehensive API documentation for the 42-transcendence backend authentication system.

## Base URL
```
http://localhost:4241
```

## What’s current (Nov 2025)

- Auth uses signed HttpOnly cookies (not Authorization headers):
  - accessToken (~15m) and refreshToken (~7d)
  - Frontend must send requests with credentials: 'include'
- Key endpoints:
  - GET /auth/google → OAuth start (redirect)
  - GET /auth/google/callback → sets cookies and redirects to /home
  - POST /auth/register, POST /auth/login → return user JSON and set cookies
  - GET /auth/me → current user (cookies required)
  - POST /auth/logout → clears cookies (cookies required)
  - POST /auth/refresh → refreshes cookies using refreshToken
  - GET /users/me → self profile (cookies)
  - PUT /users/me → update self (username, avatar, email, password)
  - DELETE /users/me → delete account

Note: CORS is configured to allow credentials from approved origins. Cookies are SameSite=strict, HttpOnly, and Secure in production.

## Authentication Methods

The API supports two authentication methods:
1. **Google OAuth** - Social login via Google
2. **Email/Password** - Traditional email and password authentication

---

## 🔐 Authentication Endpoints

### Google OAuth

#### Start Google OAuth Flow
```http
GET /auth/google
```

**Description**: Initiates Google OAuth authentication flow.

**Response**: Redirects to Google's OAuth consent screen.

**Example**:
```bash
curl http://localhost:4241/auth/google
```

---

#### Google OAuth Callback
```http
GET /auth/google/callback
```

**Description**: Handles Google OAuth callback. Sets auth cookies (accessToken, refreshToken) and redirects to /home

---

### Email/Password Authentication

#### Register User
```http
POST /auth/register
```

**Description**: Register a new user with email and password.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "DisplayName" // optional
}
```

**Response**:
200 JSON with user. Also sets auth cookies (accessToken, refreshToken).

**Error Responses**:
- `400` - User already exists
- `500` - Registration failed

**Example**:
```bash
curl -X POST http://localhost:4241/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","username":"TestUser"}'
```

---

#### Login User
```http
POST /auth/login
```

**Description**: Login with email and password.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
200 JSON with user. Also sets auth cookies (accessToken, refreshToken).

**Error Responses**:
- `401` - Invalid user or invalid password
- `500` - Login failed

**Example**:
```bash
curl -X POST http://localhost:4241/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## 👤 User Endpoints

### Get Current User (identity)
```http
GET /auth/me
```

**Description**: Get current authenticated user information (uses auth cookies).

**Response**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "Display Name",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "lastLogin": "2024-01-01T00:00:00.000Z",
  "playerStats": {
    "userId": "uuid",
    "wins": 0,
    "losses": 0,
    "playedGames": 0,
    "eloRating": 1200
  }
}
```

**Error Responses**:
- `401` - Unauthorized (invalid/missing token)
- `404` - User not found
- `500` - Failed to get user info

**Example**:
```bash
# After login, copy Set-Cookie values and send them back as Cookie header
curl -H "Cookie: accessToken=<copied>; refreshToken=<copied>" \
  http://localhost:4241/auth/me
```

---

### Get Self Profile
```http
GET /users/me
```

**Description**: Get user profile information (same as /auth/me). Uses auth cookies.

**Response**: Same as `/auth/me`

**Example**:
```bash
curl -H "Cookie: accessToken=<copied>; refreshToken=<copied>" \
  http://localhost:4241/users/me
```

---

### Update Self Profile
```http
PUT /users/me
```

**Description**: Update user profile (only provided fields). Uses auth cookies.

**Request Body**:
```json
{ "username": "NewDisplayName", "avatar": "https://...", "email": "new@example.com", "password": "newPass" }
```

**Response**: 200 { message, updatedFields: string[], user }

**Error Responses**:
- `409` - Unique constraint failed (e.g., email)
- `404` - User not found
- `500` - Failed to update user profile

**Example**:
```bash
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=<copied>; refreshToken=<copied>" \
  -d '{"username":"NewUsername"}' \
  http://localhost:4241/users/me
```

---

### Logout
```http
POST /auth/logout
```

**Description**: Logout user and clear auth cookies.

**Response**:
```json
{
  "message": "Logged out successfully"
}
```

Auth: Requires auth cookies.

**Example**:
```bash
curl -X POST \
  -H "Cookie: accessToken=<copied>; refreshToken=<copied>" \
  http://localhost:4241/auth/logout
```

### Refresh tokens
```http
POST /auth/refresh
```

Uses the signed refreshToken cookie to issue new access/refresh cookies.
Responses: 200 { message: "Token refreshed" } or 401 on invalid/expired token.

---

## 🔧 Utility Endpoints

### Health Check
```http
GET /healthcheck
```

**Description**: Check if the server is running.

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Example**:
```bash
curl http://localhost:4241/healthcheck
```

---

## 📝 Data Models

### User Model
```typescript
interface User {
  id: string;           // UUID
  email: string;         // User email (unique)
  username?: string;    // Display name
  password?: string;    // Hashed password (for local auth)
  createdAt: Date;      // Account creation date
  updatedAt: Date;      // Last update date
  lastLogin?: Date;     // Last login date
  playerStats?: PlayerStats;
}
```

### PlayerStats Model
```typescript
interface PlayerStats {
  userId: string;       // User ID (foreign key)
  wins: number;         // Number of wins
  losses: number;       // Number of losses
  playedGames: number;  // Total games played
  eloRating: number;    // ELO rating (starts at 1200)
}
```

---

## 🔑 Authentication Flow

### Google OAuth Flow
1. Frontend redirects user to `GET /auth/google`
2. User completes Google OAuth
3. Google redirects to `GET /auth/google/callback`
4. Backend processes OAuth and returns user data + JWT token
5. Frontend stores JWT token for future requests

### Email/Password Flow
1. User registers with `POST /auth/register`
2. User logs in with `POST /auth/login`
3. Backend returns user data + JWT token
4. Frontend stores JWT token for future requests

### Protected Requests
Include JWT token in Authorization header:
```
Authorization: Bearer <jwt-token>
```

---

## 🚨 Error Handling

All endpoints return appropriate HTTP status codes:

- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid credentials or missing token)
- `404` - Not Found
- `500` - Internal Server Error

Error responses include:
```json
{
  "error": "Error message",
  "details": "Additional error details" // optional
}
```

---

## 🧪 Testing

### Test Registration and Login
```bash
# Register a new user
curl -X POST http://localhost:4241/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","username":"TestUser"}'

# Login with the user
curl -X POST http://localhost:4241/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Use the returned token for protected requests
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:4241/auth/me
```

### Test Google OAuth
```bash
# Start Google OAuth flow
curl http://localhost:4241/auth/google
```

---

## 📚 Environment Variables

Required environment variables:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-jwt-secret-here"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:4241/auth/google/callback"
```

---

## 🔗 Related Documentation

- [Prisma Setup Guide](./prisma/PRISMA.md)
- [Database Schema](./prisma/schema.prisma)
- [Project README](./README.md)
