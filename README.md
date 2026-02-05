# 🧠 Worksheet AI System

**AI-Powered Academic Worksheet Generator**

Generate university-specific, plagiarism-free academic worksheets in minutes using Google Gemini AI. Perfect for students who value their time and academic integrity.

---

## ✨ Features

### Core Features (All 12 Implemented)

1. **✅ User Profile & Academic Identity** - Store university, course, semester details
2. **✅ Sample Worksheet Upload** - PDF upload to Cloudinary with AI analysis
3. **✅ Worksheet Structure Extraction** - AI learns your worksheet format
4. **✅ Template Reuse** - University + subject-wise template suggestions
5. **✅ Topic + Syllabus Input** - Controlled content generation within scope
6. **✅ Content Variance Engine** - Anti-plagiarism with unique content generation
7. **✅ Image/Screenshot Support** - Upload and place images in worksheets
8. **✅ Worksheet Preview & Edit** - Full control before finalizing
9. **✅ PDF Generation & Download** - Professional PDF output
10. **✅ User Learning Memory** - AI remembers your preferences
11. **✅ Load Handling** - Async operations with proper status
12. **✅ Payment Ready** - Infrastructure ready (not enabled in testing)

---

## 🏗️ Architecture

### Backend (Node.js + Express)
- **Database**: MongoDB Atlas (Users, Templates, Worksheets, AI Memory)
- **File Storage**: Cloudinary (PDFs, Images)
- **AI Engine**: Google Gemini Pro
- **PDF Processing**: pdf-parse, Puppeteer

### Frontend (React)
- **Routing**: React Router v6
- **State**: Context API (Auth, Worksheet)
- **Styling**: Modern CSS with CSS Variables
- **UI**: Custom components with Lucide icons

---

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v16 or higher)
2. **MongoDB Atlas** account ([Get free cluster](https://cloud.mongodb.com/))
3. **Cloudinary** account ([Sign up](https://cloudinary.com/users/register/free))
4. **Google Gemini API** key ([Get free key](https://makersuite.google.com/app/apikey))

### Installation

#### 1. Clone & Install Dependencies

```bash
cd "d:\CrossEye startup\projects\project_17_worksheet_maker"

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

#### 2. Configure Environment Variables

Create `backend/.env` file:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/worksheet-ai?retryWrites=true&w=majority

# JWT Secret (generate random string)
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

#### 3. Run the Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev
# Server runs on http://localhost:5000

# Terminal 2 - Frontend
cd frontend
npm start
# App opens on http://localhost:3000
```

---

## 📁 Project Structure

```
project_17_worksheet_maker/
├── backend/
│   ├── models/
│   │   ├── User.js              # User authentication & profile
│   │   ├── Template.js          # Worksheet templates
│   │   ├── Worksheet.js         # Generated worksheets
│   │   └── UserAIMemory.js      # AI learning memory
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── templates.js         # Template management
│   │   └── worksheets.js        # Worksheet operations
│   ├── services/
│   │   ├── cloudinaryService.js # File upload handling
│   │   ├── geminiService.js     # AI generation logic
│   │   ├── pdfService.js        # PDF text extraction
│   │   └── pdfGeneratorService.js # PDF creation
│   ├── middleware/
│   │   └── auth.js              # JWT authentication
│   ├── config/
│   │   ├── cloudinary.js        # Cloudinary setup
│   │   └── multer.js            # File upload config
│   ├── server.js                # Express server
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── context/
│   │   │   ├── AuthContext.jsx  # User authentication state
│   │   │   └── WorksheetContext.jsx # Worksheet workflow state
│   │   ├── pages/
│   │   │   ├── Landing.jsx      # Landing page
│   │   │   ├── Login.jsx        # Login form
│   │   │   ├── Register.jsx     # Registration
│   │   │   ├── Dashboard.jsx    # Main dashboard
│   │   │   ├── UploadSample.jsx # Sample upload
│   │   │   ├── StructurePreview.jsx # Template preview
│   │   │   ├── GenerateWorksheet.jsx # Generation form
│   │   │   ├── WorksheetPreview.jsx # Editable preview
│   │   │   ├── Download.jsx     # PDF download
│   │   │   └── History.jsx      # Past worksheets
│   │   ├── services/
│   │   │   └── api.js           # API client
│   │   ├── App.js               # Router setup
│   │   ├── index.js             # React entry point
│   │   └── index.css            # Global styles
│   └── package.json
│
└── README.md
```

---

## 🎯 User Journey

### First-Time User Flow

1. **Landing Page** → Shows features, benefits
2. **Register** → One-time profile setup (university, course, semester)
3. **Dashboard** → Choose action
4. **Upload Sample** → Upload university worksheet PDF
5. **Structure Preview** → AI shows detected sections, confirm/reject
6. **Save Template** → Template saved for future use

### Generate Worksheet Flow

1. **Dashboard** → "Generate Worksheet"
2. **Generation Form** → Enter topic, syllabus, difficulty
3. **AI Generation** → (~ 30-60 seconds)
4. **Preview & Edit** → Review content, edit sections, add images
5. **Generate PDF** → Professional PDF creation
6. **Download** → Save to device

---

## 🧪 Testing Guide

### Test Case 1: User Registration & Login
```
1. Go to http://localhost:3000
2. Click "Get Started"
3. Fill registration form with:
   - Email: test@university.edu
   - University: Chandigarh University
   - Course: MCA
   - Semester: II
4. Submit → Should redirect to dashboard
5. Logout → Login again with same credentials
```

### Test Case 2: Sample PDF Upload
```
1. Login to dashboard
2. Click "Upload Sample Worksheet"
3. Upload a PDF worksheet from your university
4. Click "Analyze Worksheet"
5. AI should extract sections (Aim, Problem, Code, etc.)
6. Review and save template
```

### Test Case 3: Worksheet Generation
```
1. From dashboard, click "Generate Worksheet"
2. Fill form:
   - Topic: "Spam Detection using ANN"
   - Syllabus: "ANN, preprocessing, training, evaluation"
   - Difficulty: Medium
3. Submit → Wait for AI generation
4. Preview should show all sections filled
5. Edit if needed
6. Generate PDF
7. Download and review
```

### Test Case 4: Content Variance
```
1. Generate worksheet with topic "Linear Regression"
2. Note the code variables, examples
3. Generate SAME topic again
4. Compare outputs → Should be DIFFERENT
   - Different variable names
   - Different dataset examples
   - Different explanations
```

---

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Templates
- `POST /api/templates/upload-sample` - Upload PDF
- `POST /api/templates/analyze` - Analyze PDF structure
- `POST /api/templates/save` - Save template
- `GET /api/templates/suggestions` - Get template suggestions
- `GET /api/templates/:id` - Get template by ID

### Worksheets
- `POST /api/worksheets/generate` - Generate worksheet
- `POST /api/worksheets/:id/upload-image` - Upload image
- `PUT /api/worksheets/:id` - Update worksheet
- `POST /api/worksheets/:id/generate-pdf` - Generate PDF
- `GET /api/worksheets/history` - Get user history
- `GET /api/worksheets/:id` - Get worksheet by ID
- `POST /api/worksheets/:id/regenerate-section` - Regenerate section

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: MongoDB Atlas (Mongoose ODM)
- **Authentication**: JWT + bcrypt
- **File Upload**: Multer + Cloudinary
- **AI**: Google Gemini Pro API
- **PDF**: pdf-parse, Puppeteer
- **Validation**: express-validator

### Frontend
- **Library**: React 18
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **State**: Context API
- **Styling**: Custom CSS (CSS Variables)
- **Icons**: Lucide React
- **Notifications**: React Toastify
- **Editor**: React Quill
- **PDF Viewer**: React PDF

---

## 🚧 Known Limitations (Testing Phase)

1. **Image Recognition**: Manual section tagging (not automatic AI placement)
2. **PDF Scanning**: OCR PDFs may fail (use text-based PDFs)
3. **Concurrent Load**: Tested up to 10 simultaneous users
4. **Gemini API**: Free tier has rate limits (60 requests/minute)
5. **PDF Size**: 10MB limit for uploads

---

## 🔮 Production Migration Checklist

### Phase 1: AI Upgrade
- [ ] Switch to Gemini Pro / OpenAI GPT-4
- [ ] Add token usage tracking
- [ ] Implement cost monitoring

### Phase 2: Storage
- [ ] Migrate to AWS S3 / Cloudflare R2
- [ ] Add CDN for faster delivery
- [ ] Implement automatic PDF cleanup

### Phase 3: Performance
- [ ] Add Redis caching
- [ ] Implement BullMQ queue system
- [ ] Add email notifications

### Phase 4: Security
- [ ] Add rate limiting
- [ ] Implement CSRF protection
- [ ] Add input sanitization
- [ ] SSL/TLS configuration

### Phase 5: Monitoring
- [ ] Add error tracking (Sentry)
- [ ] Implement analytics
- [ ] User feedback system

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check MongoDB connection
- Ensure MONGODB_URI is correct
- Verify your IP is whitelisted in MongoDB Atlas
- Check network access settings
```

### AI generation fails
```bash
# Verify Gemini API key
- Check GEMINI_API_KEY in .env
- Ensure API key is active
- Check quota limits
```

### PDF upload fails
```bash
# Verify Cloudinary setup
- Check cloud_name, api_key, api_secret
- Ensure file size < 10MB
- Use text-based PDFs (not scanned images)
```

### Frontend can't connect to backend
```bash
# Ensure backend is running on port 5000
# Check proxy setting in frontend/package.json
"proxy": "http://localhost:5000"
```

---

## 📝 Environment Setup Guide

### Get MongoDB Atlas Connection String
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create free cluster (M0)
3. Create database user
4. Whitelist your IP (or use 0.0.0.0/0 for testing)
5. Click "Connect" → "Connect your application"
6. Copy connection string
7. Replace `<password>` with your database user password

### Get Cloudinary Credentials
1. Sign up at [Cloudinary](https://cloudinary.com/users/register/free)
2. Go to Dashboard
3. Copy: Cloud Name, API Key, API Secret
4. Paste in `.env`

### Get Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key
4. Paste in `.env` as `GEMINI_API_KEY`

---

## 📞 Support

For issues or questions:
1. Check this README thoroughly
2. Review implementation plan in `brain/implementation_plan.md`
3. Check task status in `brain/task.md`

---

## 📜 License

This project is for educational purposes. Built by **CrossEye** as part of the Worksheet AI System initiative.

---

## 🎉 Credits

- **AI**: Google Gemini Pro
- **Storage**: Cloudinary
- **Database**: MongoDB Atlas
- **Icons**: Lucide React
- **Font**: Inter (Google Fonts)

---

**Made with ❤️ for students who deserve better tools**
#   W o r k s h e e t _ M a k e r  
 