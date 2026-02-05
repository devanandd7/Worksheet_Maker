import express from 'express';
import { body, validationResult } from 'express-validator';
import auth from '../middleware/auth.js';
import upload from '../config/multer.js';
import Template from '../models/Template.js';
import User from '../models/User.js';
import cloudinaryService from '../services/cloudinaryService.js';
import pdfService from '../services/pdfService.js';
import geminiService from '../services/geminiService.js';

const router = express.Router();

/**
 * @route   POST /api/templates/upload-sample
 * @desc    Upload sample worksheet PDF
 * @access  Private
 */
router.post('/upload-sample', auth, upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No PDF file uploaded'
            });
        }

        console.log('📄 Extracting text from PDF...');

        // Extract text from PDF buffer BEFORE uploading to Cloudinary
        const extractedData = await pdfService.extractTextFromPDF(req.file.buffer);

        console.log(`✅ Extracted ${extractedData.text.length} characters from ${extractedData.pages} pages`);

        // Upload to Cloudinary
        console.log('☁️ Uploading to Cloudinary...');
        const uploadResult = await cloudinaryService.uploadPDF(
            req.file.buffer,
            req.file.originalname,
            req.userId.toString()
        );

        console.log('✅ Upload complete');

        res.json({
            success: true,
            message: 'PDF uploaded successfully',
            data: {
                pdfUrl: uploadResult.url,
                publicId: uploadResult.publicId,
                size: uploadResult.bytes,
                extractedText: extractedData.text,
                pages: extractedData.pages
            }
        });
    } catch (error) {
        console.error('Upload sample error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload PDF'
        });
    }
});

/**
 * @route   POST /api/templates/analyze
 * @desc    Analyze uploaded PDF and extract structure
 * @access  Private
 */
router.post('/analyze', auth, [
    body('pdfUrl').notEmpty().withMessage('PDF URL is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { pdfUrl } = req.body;
        const user = await User.findById(req.userId);

        // Extract text from PDF
        console.log('Extracting text from PDF...');
        const extractedData = await pdfService.extractTextFromURL(pdfUrl);

        // Validate PDF structure
        const validation = pdfService.validatePDFStructure(extractedData);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'PDF validation failed',
                issues: validation.issues
            });
        }

        // Detect sections
        const detectedSections = pdfService.detectSections(extractedData.text);

        // Analyze with AI
        console.log('Analyzing structure with AI...');
        const aiAnalysis = await geminiService.analyzeWorksheetStructure(
            extractedData.text,
            {
                university: user.university,
                course: user.course,
                subject: user.defaultSubject
            }
        );

        // Use AI sections if confidence is high, otherwise use detected sections
        const finalSections = aiAnalysis.confidence === 'high' && aiAnalysis.sections.length > 0
            ? aiAnalysis.sections
            : detectedSections;

        res.json({
            success: true,
            message: 'PDF analyzed successfully',
            data: {
                sections: finalSections,
                style: aiAnalysis.style,
                level: aiAnalysis.level,
                confidence: aiAnalysis.confidence,
                pdfUrl: pdfUrl,
                pages: extractedData.pages
            }
        });
    } catch (error) {
        console.error('Analyze PDF error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to analyze PDF'
        });
    }
});

/**
 * @route   POST /api/templates/save
 * @desc    Save analyzed template
 * @access  Private
 */
router.post('/save', auth, [
    body('sections').isArray().withMessage('Sections must be an array'),
    body('style').notEmpty().withMessage('Style is required'),
    body('subject').notEmpty().withMessage('Subject is required')
], async (req, res) => {
    try {
        console.log('Save template request body:', JSON.stringify(req.body, null, 2));

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { sections, style, level, subject, pdfUrl } = req.body;
        const user = await User.findById(req.userId);

        // Create template name
        const templateName = `${user.university.replace(/\s+/g, '_')}_${subject.replace(/\s+/g, '_')}_${Date.now()}`;

        // Create template
        const template = new Template({
            templateName,
            university: user.university,
            course: user.course,
            subject,
            sectionsOrder: sections,
            style: style || 'Formal Academic',
            level: level || 'Post Graduate',
            createdFromSample: !!pdfUrl,
            samplePdfUrl: pdfUrl,
            userId: req.userId
        });

        await template.save();

        res.status(201).json({
            success: true,
            message: 'Template saved successfully',
            template
        });
    } catch (error) {
        console.error('Save template error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to save template'
        });
    }
});

/**
 * @route   GET /api/templates/suggestions
 * @desc    Get template suggestions based on user's profile
 * @access  Private
 */
router.get('/suggestions', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const { subject } = req.query;

        // Find matching templates
        const query = {
            university: user.university,
            course: user.course
        };

        if (subject) {
            query.subject = subject;
        }

        const templates = await Template.find(query)
            .sort({ usageCount: -1, createdAt: -1 })
            .limit(5);

        res.json({
            success: true,
            count: templates.length,
            templates
        });
    } catch (error) {
        console.error('Get suggestions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get template suggestions'
        });
    }
});

/**
 * @route   GET /api/templates/:id
 * @desc    Get specific template
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);

        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Template not found'
            });
        }

        res.json({
            success: true,
            template
        });
    } catch (error) {
        console.error('Get template error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get template'
        });
    }
});

export default router;
