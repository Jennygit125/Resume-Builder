# API Documentation

This application is a **Full-Stack Serverless** architecture using Supabase (DB/Auth/Edge Functions) and Cloudinary (Media).

## Authentication
(Handled via `@supabase/supabase-js`)

### Login
- **Method:** `supabase.auth.signInWithPassword()`
- **Required:** `email`, `password`

### Sign Up
- **Method:** `supabase.auth.signUp()`
- **Required:** `email`, `password`, `options.data.firstName`

### Token Refresh
- **Method:** Handled automatically by the Supabase client session manager.

---

## Resumes
**Supabase Table:** `public.resumes`

### List Resumes
- **Client Call:** `api.getResumes()`
- **RLS:** Users can only select rows where `user_id = auth.uid()`
- **Response:**
  ```json
  [
    { "id": "uuid", "user_id": "uuid", "title": "Job Title", "content": { ... }, "status": "Draft/Completed", "last_modified": "ISO-DATE" }
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