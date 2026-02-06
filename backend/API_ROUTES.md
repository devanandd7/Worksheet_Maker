# 📡 API Routes Documentation

Base URL: `http://localhost:5000/api`

---

## 🔐 Authentication Routes (`/api/auth`)

### 1. Register User
```http
POST /api/auth/register
```

**Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "university": "MIT",
  "course": "Computer Science",
  "semester": "5th",
  "defaultSubject": "Machine Learning"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": { ... }
}
```

---

### 2. Login User
```http
POST /api/auth/login
```

**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": { ... }
}
```

---

### 3. Get User Profile
```http
GET /api/auth/profile
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "user": { ... }
}
```

---

### 4. Update User Profile
```http
PUT /api/auth/profile
```

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "fullName": "John Updated",
  "defaultSubject": "Deep Learning"
}
```

**Response:** `200 OK`

---

## 📄 Template Routes (`/api/templates`)

### 1. Upload Sample PDF
```http
POST /api/templates/upload-sample
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body (Form Data):**
```
pdf: [PDF file]
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "PDF uploaded successfully",
  "pdfUrl": "https://cloudinary.com/...",
  "extractedText": "..."
}
```

---

### 2. Analyze Template
```http
POST /api/templates/analyze
```

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "pdfUrl": "https://cloudinary.com/...",
  "extractedText": "..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "analysis": {
    "university": "MIT",
    "subject": "Machine Learning",
    "sectionsOrder": ["aim", "code", "output"],
    "style": "Formal Academic",
    "level": "Post Graduate"
  }
}
```

---

### 3. Save Template
```http
POST /api/templates/save
```

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "templateName": "ML Lab Template",
  "university": "MIT",
  "course": "CSE",
  "subject": "Machine Learning",
  "sectionsOrder": ["aim", "code", "output"],
  "style": "Formal Academic",
  "level": "Post Graduate",
  "pdfUrl": "https://cloudinary.com/..."
}
```

**Response:** `201 Created`

---

### 4. Get Template Suggestions
```http
GET /api/templates/suggestions?subject=Machine Learning
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "templates": [
    {
      "_id": "...",
      "templateName": "ML Lab Template",
      "university": "MIT",
      "subject": "Machine Learning",
      "usageCount": 5
    }
  ]
}
```

---

### 5. Get Template by ID
```http
GET /api/templates/:id
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response:** `200 OK`

---

## 📝 Worksheet Routes (`/api/worksheets`)

### 1. Generate Worksheet (AI)
```http
POST /api/worksheets/generate
```

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "topic": "Linear Regression",
  "syllabus": "Linear regression, cost function, gradient descent",
  "difficulty": "medium",
  "subject": "Machine Learning",
  "templateId": "optional_template_id",
  "additionalInstructions": "Focus on practical implementation"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Worksheet generated successfully",
  "worksheet": {
    "_id": "...",
    "topic": "Linear Regression",
    "content": {
      "aim": "...",
      "problemStatement": "...",
      "algorithm": "...",
      "code": "...",
      "output": "...",
      "conclusion": "..."
    }
  }
}
```

---

### 2. Upload Image to Worksheet
```http
POST /api/worksheets/:id/upload-image
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body (Form Data):**
```
image: [Image file]
section: "Output"
caption: "Training accuracy graph"
```

**Response:** `200 OK`

---

### 3. Update Worksheet
```http
PUT /api/worksheets/:id
```

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "content": {
    "aim": "Updated aim...",
    "code": "Updated code..."
  }
}
```

**Response:** `200 OK`

---

### 4. Generate PDF
```http
POST /api/worksheets/:id/generate-pdf
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "PDF generated successfully",
  "pdfUrl": "https://cloudinary.com/..."
}
```

---

### 5. Get Worksheet History
```http
GET /api/worksheets/history?page=1&limit=10
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 10,
  "total": 25,
  "page": 1,
  "pages": 3,
  "worksheets": [...]
}
```

---

### 6. Get Worksheet by ID
```http
GET /api/worksheets/:id
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response:** `200 OK`

---

### 7. Regenerate Section
```http
POST /api/worksheets/:id/regenerate-section
```

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "section": "Code",
  "currentContent": "...",
  "context": {
    "topic": "Linear Regression",
    "syllabus": "..."
  }
}
```

**Response:** `200 OK`

---

## 🧪 Testing & Utility Routes

### 1. Health Check
```http
GET /api/health
```

**Response:** `200 OK`
```json
{
  "status": "OK",
  "message": "Worksheet AI System API is running",
  "timestamp": "2026-02-04T14:24:49.000Z"
}
```

---

### 2. Test Gemini AI (NEW!)
```http
GET /api/test/gemini
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Gemini AI is working",
  "apiKeyValid": true,
  "model": "gemini-1.5-flash",
  "testResponse": "Hello from Gemini!"
}
```

**Or if failed:** `500 Internal Server Error`
```json
{
  "success": false,
  "message": "Gemini AI test failed",
  "error": "API Key not found..."
}
```

---

## 📋 Quick Test Commands (Using curl)

### Test Health
```bash
curl http://localhost:5000/api/health
```

### Test Gemini AI
```bash
curl http://localhost:5000/api/test/gemini
```

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "password": "test123",
    "university": "Test University",
    "course": "CS",
    "semester": "5th"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

### Generate Worksheet (requires token)
```bash
curl -X POST http://localhost:5000/api/worksheets/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "topic": "Linear Regression",
    "syllabus": "Linear regression, cost function",
    "difficulty": "medium"
  }'
```

---

## 🔑 Authentication

Most routes require JWT authentication. Include the token in header:
```
Authorization: Bearer {token}
```

Get token from `/api/auth/register` or `/api/auth/login`

---

## 📊 Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid/missing token) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 🚀 Testing in Postman/Thunder Client

1. Import these routes as a collection
2. Set environment variable: `BASE_URL = http://localhost:5000/api`
3. Set `TOKEN` variable after login
4. Use `{{BASE_URL}}` and `{{TOKEN}}` in requests
