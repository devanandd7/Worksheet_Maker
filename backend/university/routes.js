import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import University from './University.js';
import Template from '../models/Template.js';
import pdfService from '../services/pdfService.js';
import geminiService from '../services/geminiService.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Configure Cloudinary Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'worksheet-ai/universities',
        allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
        resource_type: 'auto',
        access_mode: 'public' // Explicitly set public access for new uploads
    }
});

const upload = multer({ storage: storage });

// Admin Check Middleware
const adminCheck = (req, res, next) => {
    const adminEmail = process.env.ADMIN_EMAIL;
    console.log(`🛡️ Admin Check: User=${req.user?.email}, Admin=${adminEmail}`);

    if (!adminEmail || req.user.email !== adminEmail) {
        console.warn('⛔ Access denied: Email mismatch');
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    next();
};

/**
 * @route   GET /api/universities
 * @desc    Get all active universities (Public for Dropdown)
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const universities = await University.find({ isActive: true })
            .populate('defaultTemplateId', 'templateName sectionsOrder style level')
            .select('name headerImageUrl sampleTemplateUrl defaultTemplateId analysisStatus')
            .sort({ name: 1 })
            .lean();
        console.log(`📡 Public Universites Fetched: ${universities.length}`);
        res.json({ success: true, universities });
    } catch (error) {
        console.error('Fetch universities error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

/**
 * @route   GET /api/universities/all
 * @desc    Get ALL universities (Admin List)
 * @access  Admin only
 */
router.get('/all', auth, adminCheck, async (req, res) => {
    try {
        console.log('👑 Admin fetching ALL universities...');
        const universities = await University.find().sort({ createdAt: -1 });
        console.log(`✅ Admin found ${universities.length} universities.`);
        res.json({ success: true, universities });
    } catch (error) {
        console.error('❌ Admin Fetch Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

/**
 * @route   POST /api/universities
 * @desc    Create new university preset
 * @access  Admin only
 */
router.post('/', auth, adminCheck, upload.fields([
    { name: 'headerImage', maxCount: 1 },
    { name: 'sampleTemplate', maxCount: 1 }
]), async (req, res) => {
    try {
        const { name } = req.body;

        if (!req.files.headerImage || !req.files.sampleTemplate) {
            return res.status(400).json({ success: false, message: 'Both Header Image and Sample PDF are required' });
        }

        const headerImg = req.files.headerImage[0];
        const samplePdf = req.files.sampleTemplate[0];

        const existing = await University.findOne({ name });
        if (existing) {
            return res.status(400).json({ success: false, message: 'University name already exists' });
        }

        const university = await University.create({
            name,
            headerImageUrl: headerImg.path,
            headerImagePublicId: headerImg.filename,
            sampleTemplateUrl: samplePdf.path,
            sampleTemplatePublicId: samplePdf.filename
        });

        // --- Auto-Analyze & Create Template ---
        console.log(`🤖 Analyzing sample template for ${name}...`);

        // Update status to processing (though it defaults to pending, we want to show it's started)
        university.analysisStatus = 'processing';
        await university.save();

        // Perform analysis asynchronously
        (async () => {
            try {
                // Generate Secure Download URL (bypass delivery restrictions)
                let pdfUrl = samplePdf.path;
                if (samplePdf.filename) {
                    // Use private_download_url to generate a signed API download link
                    // This works even if PDF delivery is restricted in Cloudinary settings
                    pdfUrl = cloudinary.utils.private_download_url(samplePdf.filename, 'pdf', {
                        type: 'upload', // Default multer upload type
                        attachment: false,
                        expires_at: Math.floor(Date.now() / 1000) + 3600
                    });
                    console.log('🔐 Generated private API download URL for analysis');
                }

                // 1. Extract Text
                const extractedData = await pdfService.extractTextFromURL(pdfUrl);

                // 2. Analyze Structure
                const aiAnalysis = await geminiService.analyzeWorksheetStructure(
                    extractedData.text,
                    {
                        university: name,
                        course: 'General',
                        subject: 'General'
                    }
                );

                // 3. Create Template
                const newTemplate = new Template({
                    templateName: `${name} Official Template`,
                    university: name,
                    course: 'General',
                    subject: 'General',
                    sectionsOrder: aiAnalysis.sections || ['Aim', 'Theory', 'Procedure', 'Observation', 'Result'], // Fallback
                    style: aiAnalysis.style || 'Formal Academic',
                    level: aiAnalysis.level || 'Undergraduate',
                    createdFromSample: true,
                    samplePdfUrl: samplePdf.path, // Store original URL
                    userId: req.user._id, // Admin User ID
                    status: 'active'
                });

                await newTemplate.save();
                console.log(`✅ Default Template Created: ${newTemplate._id}`);

                // 4. Link to University & Update Status
                university.defaultTemplateId = newTemplate._id;
                university.analysisStatus = 'completed';
                university.analysisError = null;
                await university.save();

            } catch (analysisError) {
                console.error('⚠️ Template analysis failed:', analysisError);
                // Update status to failed
                university.analysisStatus = 'failed';
                university.analysisError = analysisError.message || 'Analysis failed';
                await university.save();
            }
        })();

        res.status(201).json({ success: true, university });
    } catch (error) {
        console.error('Create university error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   DELETE /api/universities/:id
 * @desc    Delete university
 * @access  Admin only
 */
router.delete('/:id', auth, adminCheck, async (req, res) => {
    try {
        const university = await University.findById(req.params.id);
        if (!university) {
            return res.status(404).json({ success: false, message: 'University not found' });
        }

        // Delete files from Cloudinary
        await cloudinary.uploader.destroy(university.headerImagePublicId);
        await cloudinary.uploader.destroy(university.sampleTemplatePublicId); // Ensure resource_type is handled if needed (default image)

        await university.deleteOne();
        res.json({ success: true, message: 'University deleted' });
    } catch (error) {
        console.error('Delete university error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

/**
 * @route   POST /api/universities/:id/analyze
 * @desc    Manually trigger/retry analysis for a university
 * @access  Admin only
 */
router.post('/:id/analyze', auth, adminCheck, async (req, res) => {
    try {
        const university = await University.findById(req.params.id);
        if (!university) {
            return res.status(404).json({ success: false, message: 'University not found' });
        }

        if (!university.sampleTemplateUrl) {
            return res.status(400).json({ success: false, message: 'No sample PDF available to analyze' });
        }

        // Return immediately to client
        res.json({ success: true, message: 'Analysis started in background' });

        // Start Analysis in Background
        console.log(`🔄 Retrying analysis for ${university.name}...`);
        university.analysisStatus = 'processing';
        await university.save();

        try {
            // Generate Secure Download URL
            let pdfUrl = university.sampleTemplateUrl;
            if (university.sampleTemplatePublicId) {
                pdfUrl = cloudinary.utils.private_download_url(university.sampleTemplatePublicId, 'pdf', {
                    type: 'upload', // Assumption: standard uploads are type 'upload'
                    attachment: false,
                    expires_at: Math.floor(Date.now() / 1000) + 3600
                });
                console.log('🔐 Generated private API download URL for retry analysis');
            }

            // 1. Extract Text (Helper function to handle different URL types if needed)
            const extractedData = await pdfService.extractTextFromURL(pdfUrl);

            // 2. Analyze Structure
            const aiAnalysis = await geminiService.analyzeWorksheetStructure(
                extractedData.text,
                {
                    university: university.name,
                    course: 'General',
                    subject: 'General'
                }
            );

            // 3. Create or Update Template
            // Check if one already exists to overwrite or create new
            let template;
            if (university.defaultTemplateId) {
                template = await Template.findById(university.defaultTemplateId);
            }

            if (template) {
                // Update existing
                template.sectionsOrder = aiAnalysis.sections || template.sectionsOrder;
                template.style = aiAnalysis.style || template.style;
                template.level = aiAnalysis.level || template.level;
                await template.save();
                console.log(`✅ Default Template Updated: ${template._id}`);
            } else {
                // Create new
                template = new Template({
                    templateName: `${university.name} Official Template`,
                    university: university.name,
                    course: 'General',
                    subject: 'General',
                    sectionsOrder: aiAnalysis.sections || ['Aim', 'Theory', 'Procedure', 'Observation', 'Result'],
                    style: aiAnalysis.style || 'Formal Academic',
                    level: aiAnalysis.level || 'Undergraduate',
                    createdFromSample: true,
                    samplePdfUrl: university.sampleTemplateUrl,
                    userId: req.user._id,
                    status: 'active'
                });
                await template.save();
                console.log(`✅ Default Template Created: ${template._id}`);
            }

            // 4. Update University Status
            university.defaultTemplateId = template._id;
            university.analysisStatus = 'completed';
            university.analysisError = null;
            await university.save();

        } catch (error) {
            console.error('❌ Retry analysis failed:', error);
            university.analysisStatus = 'failed';
            university.analysisError = error.message || 'Analysis failed';
            await university.save();
        }

    } catch (error) {
        console.error('Retry endpoint error:', error);
        // If we haven't sent response yet
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Server request failed' });
        }
    }
});

export default router;
