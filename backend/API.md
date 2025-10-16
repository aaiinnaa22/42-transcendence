# API Documentation - 42 Transcendence Backend

This document provides comprehensive API documentation for the 42-transcendence backend authentication system.

## Base URL
```
http://localhost:4241
```

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

**Description**: Handles Google OAuth callback (internal use).

**Response**:
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "googleId": "google-user-id",
    "email": "user@example.com",
    "username": "Display Name",
    "avatarUrl": "https://...",
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
  },
  "appToken": "jwt-token-here"
}
```

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
```json
{
  "message": "Registration successful",
  "user": {
    "id": "uuid",
    "googleId": "local-timestamp",
    "email": "user@example.com",
    "username": "DisplayName",
    "avatarUrl": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "lastLogin": null,
    "playerStats": {
      "userId": "uuid",
      "wins": 0,
      "losses": 0,
      "playedGames": 0,
      "eloRating": 1200
    }
  },
  "appToken": "jwt-token-here"
}
```

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
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "googleId": "local-timestamp",
    "email": "user@example.com",
    "username": "DisplayName",
    "avatarUrl": null,
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
  },
  "appToken": "jwt-token-here"
}
```

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

### Get Current User
```http
GET /auth/me
```

**Description**: Get current authenticated user information.

**Headers**:
```
Authorization: Bearer <jwt-token>
```

**Response**:
```json
{
  "id": "uuid",
  "googleId": "google-user-id",
  "email": "user@example.com",
  "username": "Display Name",
  "avatarUrl": "https://...",
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
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:4241/auth/me
```

---

### Get User Profile
```http
GET /users/profile
```

**Description**: Get user profile information (same as /auth/me).

**Headers**:
```
Authorization: Bearer <jwt-token>
```

**Response**: Same as `/auth/me`

**Example**:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:4241/users/profile
```

---

### Update User Profile
```http
PUT /users/profile
```

**Description**: Update user profile information.

**Headers**:
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "username": "NewDisplayName", // optional
  "avatarUrl": "https://new-avatar-url.com" // optional
}
```

**Response**:
```json
{
  "id": "uuid",
  "googleId": "google-user-id",
  "email": "user@example.com",
  "username": "NewDisplayName",
  "avatarUrl": "https://new-avatar-url.com",
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
- `500` - Failed to update user profile

**Example**:
```bash
curl -X PUT -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"NewUsername"}' \
  http://localhost:4241/users/profile
```

---

### Logout
```http
POST /auth/logout
```

**Description**: Logout user (client should discard token).

**Headers**:
```
Authorization: Bearer <jwt-token>
```

**Response**:
```json
{
  "message": "Logged out successfully"
}
```

**Error Responses**:
- `401` - Unauthorized (invalid/missing token)

**Example**:
```bash
curl -X POST -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:4241/auth/logout
```

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
  googleId: string;     // Google user ID or local timestamp
  email: string;         // User email (unique)
  username?: string;    // Display name
  avatarUrl?: string;   // Profile picture URL
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
