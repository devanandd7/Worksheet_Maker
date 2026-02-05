# 🖼️ Cloudinary Setup Guide

## Why Cloudinary is Needed
Cloud storage for PDF uploads and images. Without it, file uploads will fail.

---

## Quick Setup (5 minutes)

### Step 1: Create Free Account
1. Go to: **https://cloudinary.com/users/register/free**
2. Sign up with email (it's FREE)
3. Verify your email

### Step 2: Get Your Credentials
1. After login, you'll see the **Dashboard**
2. You'll see a card that says **"Account Details"**
3. **Copy these THREE values:**
   - **Cloud name**
   - **API Key**
   - **API Secret**

**Example of what you'll see:**
```
Cloud name: myworksheetapp
API Key: 123456789012345
API Secret: AbCdEfGhIjKlMnOpQrStUvWxYz
```

### Step 3: Update .env File
1. Open `backend/.env`
2. Find these lines:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name_here
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

3. Replace with YOUR actual values:
   ```env
   CLOUDINARY_CLOUD_NAME=myworksheetapp
   CLOUDINARY_API_KEY=123456789012345
   CLOUDINARY_API_SECRET=AbCdEfGhIjKlMnOpQrStUvWxYz
   ```

4. **Save the file**

### Step 4: Restart Backend
```bash
# Stop the backend (Ctrl+C in terminal)
# Then restart:
node server.js
```

You should see:
```
✅ Cloudinary configured successfully
```

---

## Test Upload Feature

1. Login to app
2. Go to "Upload Sample Worksheet"
3. Select a PDF file
4. Click "Upload & Analyze PDF"
5. ✅ Should work now!

---

## Troubleshooting

### Error: "Cloudinary not configured"
**Solution**: Check that all three values are correct in `.env`

### Error: "Invalid API Key"
**Solution**: 
- Make sure you copied the COMPLETE API Key
- No spaces before or after the value
- Check for typos

### Error: "Upload failed"
**Solution**:
- Restart backend after changing `.env`
- Check file size < 10MB
- Use text-based PDF (not scanned images)

---

## Free Tier Limits
- **Storage**: 25GB
- **Bandwidth**: 25GB/month
- **Transformations**: 25,000/month

**Perfect for testing!** Upgrade later if needed.

---

## Security Note
Never commit your `.env` file to GitHub! It's already in `.gitignore`.
