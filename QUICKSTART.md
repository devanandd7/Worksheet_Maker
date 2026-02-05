# 🚀 Quick Start Guide - Worksheet AI System

## ⚡ 5-Minute Setup

### Step 1: Get Your API Credentials (5 minutes)

#### MongoDB Atlas (Free) - [cloud.mongodb.com](https://cloud.mongodb.com/)
1. Sign up / Login
2. Create FREE cluster (M0)
3. Create database user (username + password)
4. Network Access → Add IP → "Allow from anywhere" (0.0.0.0/0)
5. Click "Connect" → "Connect your application"
6. **Copy connection string**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/worksheet-ai?retryWrites=true&w=majority
   ```
   Replace `<password>` with your database password

#### Cloudinary (Free) - [cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
1. Sign up with email
2. Go to Dashboard
3. **Copy three values:**
   - Cloud Name
   - API Key
   - API Secret

#### Google Gemini AI (Free) - [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
1. Go to Google AI Studio
2. Click "Create API Key"
3. **Copy the API key**

---

### Step 2: Configure Environment (2 minutes)

Open `backend/.env` file and update:

```env
# Replace these values with your actual credentials:

MONGODB_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/worksheet-ai?retryWrites=true&w=majority
CLOUDINARY_CLOUD_NAME=your_cloud_name_from_dashboard
CLOUDINARY_API_KEY=your_api_key_from_dashboard
CLOUDINARY_API_SECRET=your_api_secret_from_dashboard
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=any_random_long_string_123456789
```

**Save the file!**

---

### Step 3: Install & Run (3 minutes)

#### Option A: Automated (Recommended)
```bash
# Run this from project root
setup.bat
```

#### Option B: Manual
```bash
# Backend
cd backend
npm install

# Frontend (new terminal)
cd frontend
npm install
```

---

### Step 4: Start the Application

**Open TWO terminals:**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Wait for: `✅ MongoDB Connected Successfully`
and `🚀 Server running on port 5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
Browser should auto-open: `http://localhost:3000`

---

## ✅ Verify It's Working

### Test 1: Open Landing Page
- Go to http://localhost:3000
- Should see beautiful landing page with gradient background
- ✅ Frontend working!

### Test 2: Check Backend API
- Go to http://localhost:5000/api/health
- Should see: `{"status":"OK","message":"Worksheet AI System API is running"}`
- ✅ Backend working!

### Test 3: Register Account
- Click "Get Started"
- Fill form with your details:
  ```
  Name: Your Name
  Email: test@university.edu
  Password: test123
  University: Your University
  Course: MCA / BCA / B.Tech
  Semester: II
  ```
- Click "Create Account"
- Should redirect to dashboard
- ✅ Database connection working!

---

## 🎯 First Worksheet Generation

### Step 1: Register & Login
- Create account (if not done)
- Login to dashboard

### Step 2: Generate Worksheet
1. Click **"Generate Worksheet"** (you can skip sample upload for now)
2. Fill the form:
   ```
   Topic: Linear Regression Implementation
   Syllabus: Linear regression, cost function, gradient descent, sklearn
   Difficulty: Medium
   ```
3. Click **"Generate Worksheet"**
4. ⏳ Wait 30-60 seconds (AI is generating)
5. ✅ Review generated content!

### Step 3: Edit & Download
1. Review each section (Aim, Problem, Code, Output)
2. Edit if needed
3. Click **"Generate PDF"**
4. Click **"Download"**
5. 🎉 Professional PDF ready!

---

## 🐛 Common Issues & Fixes

### ❌ "MongoDB connection failed"
**Fix:**
- Check MONGODB_URI in backend/.env
- Verify username:password in connection string
- Ensure IP is whitelisted in MongoDB Atlas

### ❌ "Gemini AI not configured"
**Fix:**
- Check GEMINI_API_KEY in backend/.env
- Verify key is active at https://makersuite.google.com
- Ensure no typos in the key

### ❌ "PDF upload fails"
**Fix:**
- Check all three Cloudinary values (cloud_name, api_key, api_secret)
- Verify credentials at https://cloudinary.com/console
- Use text-based PDF (not scanned images)

### ❌ "Frontend can't reach backend"
**Fix:**
- Ensure backend terminal shows "Server running on port 5000"
- Check both terminals are running
- Clear browser cache (Ctrl + Shift + Delete)

---

## 📚 What to Try Next

1. **Upload Sample Worksheet** - Upload your university's worksheet PDF
2. **Generate Multiple Worksheets** - Try same topic twice, compare uniqueness
3. **Edit Content** - Modify AI-generated sections
4. **Add Images** - Upload output screenshots
5. **View History** - See all your past worksheets

---

## 🎓 Full Feature List

✅ User Profile & Academic Identity
✅ Sample Worksheet Upload (PDF → AI Analysis)
✅ Template Reuse (University-specific)
✅ AI Worksheet Generation (Gemini Pro)
✅ Content Variance (Anti-plagiarism)
✅ Image Upload Support
✅ Editable Preview
✅ Professional PDF Generation
✅ User Learning Memory
✅ Worksheet History
✅ Version Control
✅ Production-Ready Architecture

---

## 📖 Need More Help?

- **Detailed Setup**: See [README.md](file:///d:/CrossEye%20startup/projects/project_17_worksheet_maker/README.md)
- **Complete Walkthrough**: See [walkthrough.md](file:///C:/Users/HELLO/.gemini/antigravity/brain/b29ea2d9-6202-4107-9f56-48f2f68e5332/walkthrough.md)
- **Implementation Details**: See [implementation_plan.md](file:///C:/Users/HELLO/.gemini/antigravity/brain/b29ea2d9-6202-4107-9f56-48f2f68e5332/implementation_plan.md)

---

## 🚀 You're Ready!

Your Worksheet AI System is now running and ready to generate worksheets. All 12 core features are implemented and working.

**Happy worksheet generating! 🎉**
