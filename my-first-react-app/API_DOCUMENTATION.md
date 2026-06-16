# API Documentation

All endpoints are prefixed with the base URL defined in `VITE_API_BASE_URL`.

## Authentication

### Login
- **Endpoint:** `POST /signIn`
- **Payload:** `{ "email": "user@example.com", "password": "...", "rememberMe": boolean }`
- **Response (200 OK):**
  ```json
  {
    "user": { "firstName": "John", "email": "john@example.com" },
    "token": "JWT_ACCESS_TOKEN",
    "refreshToken": "JWT_REFRESH_TOKEN"
  }
  ```

### Sign Up
- **Endpoint:** `POST /signUp`
- **Payload:** `{ "username": "johndoe", "email": "john@example.com", "password": "..." }`
- **Response (201 Created):** `{ "success": true }`

### Token Refresh
- **Endpoint:** `POST /refresh`
- **Payload:** `{ "refreshToken": "..." }`
- **Response (200 OK):** `{ "accessToken": "...", "refreshToken": "..." }`

---

## Resumes

### List Resumes
- **Endpoint:** `GET /resumes`
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
  ```json
  [
    { "id": "1", "title": "Software Engineer", "lastModified": "2h ago", "status": "Completed" }
  ]
  ```

### Get Dashboard Stats
- **Endpoint:** `GET /stats/dashboard`
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
  ```json
  { "total": 12, "downloads": 48, "views": 156 }
  ```

### Delete Resume
- **Endpoint:** `DELETE /resumes/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):** `{ "success": true }`

### Save/Update Resume
- **Endpoint:** `POST /resumes`
- **Payload:** `{ "title": "...", "content": { ...resumeData } }`
- **Response (200 OK):** `{ "id": "...", "success": true }`

---

## AI Features

### Generate Resume
- **Endpoint:** `POST /ai/generate`
- **Payload:** `{ "prompt": "Job Description..." }`
- **Response (200 OK):** `{ ...fullResumeDataObject }`

### Analyze Resume
- **Endpoint:** `POST /ai/analyze/:id`
- **Response (200 OK):**
  ```json
  {
    "score": 85,
    "feedback": ["Add more keywords", "Quantify metrics"]
  }
  ```