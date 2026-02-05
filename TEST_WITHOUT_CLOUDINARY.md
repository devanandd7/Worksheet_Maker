# ⚡ Quick Start - Test Without Cloudinary

## You can test the app RIGHT NOW!

### Skip Upload Feature & Test Generation

1. **Go to Dashboard** in your browser
2. Click **"Generate Worksheet"** (skip the upload)
3. Fill in the form:
   ```
   Topic: Linear Regression Implementation
   Syllabus: Linear regression, cost function, gradient descent
   Difficulty: Medium
   ```
4. Click **"Generate Worksheet with AI"**
5. Wait ~30-60 seconds
6. ✅ **You'll get a complete AI-generated worksheet!**

---

## What Works Without Cloudinary

✅ **Registration & Login**
✅ **Generate Worksheet** (AI generation works!)
✅ **Preview & Edit** Worksheets
✅ **Worksheet History**

---

## What Requires Cloudinary

❌ Upload Sample PDF
❌ Upload Images to worksheets
❌ PDF Generation & Download

**For now, test the generation feature!** It's the core functionality.

---

## Configure Cloudinary Later (When You Want Upload/PDF Features)

See `CLOUDINARY_SETUP.md` for detailed instructions.

**Summary:**
1. Go to https://cloudinary.com/users/register/free
2. Sign up (FREE)
3. Copy **Cloud Name**, **API Key**, **API Secret** from dashboard
4. Update `backend/.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=your_actual_cloud_name_from_cloudinary
   CLOUDINARY_API_KEY=your_actual_api_key_here
   CLOUDINARY_API_SECRET=your_actual_api_secret_here
   ```
5. Restart backend

---

## 🎯 Test Now - Configuration Later!

The **Generate Worksheet** feature works independently. Try it!
