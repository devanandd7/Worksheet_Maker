import express from 'express';
import { body, validationResult } from 'express-validator';
import auth from '../middleware/auth.js';
import upload from '../config/multer.js';
import Worksheet from '../models/Worksheet.js';
import Template from '../models/Template.js';
import User from '../models/User.js';
import UserAIMemory from '../models/UserAIMemory.js';
import geminiService from '../services/geminiService.js';
import cloudinaryService from '../services/cloudinaryService.js';
import pdfGeneratorService from '../services/pdfGeneratorService.js';

const router = express.Router();

/**
 * @route   POST /api/worksheets/generate
 * @desc    Generate a new worksheet
 * @access  Private
 */
router.post('/generate', auth, upload.fields([{ name: 'images', maxCount: 5 }, { name: 'headerImage', maxCount: 1 }]), async (req, res) => {
    try {
        const {
            topic,
            subject,
            syllabus,
            difficulty,
            templateId,
            additionalInstructions = '',
            experimentNumber
        } = req.body;

        const files = req.files['images'] || [];
        const headerImageFile = req.files['headerImage'] ? req.files['headerImage'][0] : null;

        // Validate required fields
        if (!topic || !syllabus || !templateId) {
            return res.status(400).json({
                success: false,
                message: 'Please provide topic, syllabus and template ID'
            });
        }

        // Get template or create default
        let template;
        if (templateId) {
            template = await Template.findById(templateId);
            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: 'Template not found'
                });
            }
        } else {
            // Create or get default template
            template = await Template.findOne({ templateName: 'Default Template' });
            if (!template) {
                template = new Template({
                    templateName: 'Default Template',
                    university: 'General University',
                    course: 'Computer Science',
                    subject: subject || 'Computer Science Lab',
                    level: 'Post Graduate',
                    style: 'Formal Academic',
                    sectionsOrder: ['aim', 'problemStatement', 'dataset', 'algorithm', 'code', 'output', 'conclusion'],
                    userId: req.userId
                });
                await template.save();
                console.log('✅ Created default template');
            }
        }

        // Get user and AI memory
        const user = await User.findById(req.userId);
        let aiMemory = await UserAIMemory.findOne({ userId: req.userId });

        // Create AI memory if doesn't exist
        if (!aiMemory) {
            aiMemory = new UserAIMemory({ userId: req.userId });
            await aiMemory.save();
        }

        // 1. Process Images for Gemini (Inline Data)
        // Convert buffers to base64 for Gemini
        const imageParts = files.map(file => ({
            inlineData: {
                data: file.buffer.toString('base64'),
                mimeType: file.mimetype
            }
        }));


        // 2. Upload Context Images to Cloudinary
        console.log(`Processing ${files.length} context images...`);
        const uploadPromises = files.map(file =>
            cloudinaryService.uploadImage(file.buffer, req.userId, 'temp_gen').catch(err => {
                console.error('Image upload failed:', err);
                return null;
            })
        );
        const uploadedImages = (await Promise.all(uploadPromises)).filter(img => img !== null);

        // 3. Upload Header Image (if exists)
        let headerImageUrl = null;
        if (headerImageFile) {
            try {
                console.log('Processing Header Image...');
                const headerUpload = await cloudinaryService.uploadImage(headerImageFile.buffer, req.userId, 'headers');
                headerImageUrl = headerUpload.url;
            } catch (err) {
                console.error('Header image upload failed:', err);
                // Continue without header image if upload fails
            }
        }

        // Generate variation seed for uniqueness
        const variationSeed = `${req.userId}_${Date.now()}_${Math.random()}`;

        console.log('Generating worksheet with AI...');

        // 4. Generate content with AI
        const generatedContent = await geminiService.generateWorksheetContent({
            topic,
            syllabus,
            difficulty: difficulty || 'medium',
            sections: template.sectionsOrder,
            userContext: {
                university: user.university,
                course: user.course,
                semester: user.semester,
                subject: subject || user.defaultSubject || template.subject,
                level: template.level
            },
            userMemory: {
                writingDepth: aiMemory.writingDepth,
                variationLevel: aiMemory.variationLevel,
                commonMistakes: aiMemory.commonMistakes
            },
            additionalInstructions: additionalInstructions || '',
            variationSeed,
            images: imageParts // Pass ONLY context images to Gemini
        });

        // ✅ PROCESS MULTI-PART QUESTIONS
        let formattedQuestionTitle = '';
        if (generatedContent.mainQuestionTitle && generatedContent.questionParts) {
            formattedQuestionTitle = `<div style="margin-bottom: 24px;">
              <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 16px;">${generatedContent.mainQuestionTitle}</h3>
              <div style="margin-left: 20px;">
                ${generatedContent.questionParts.map(p => `
                  <p style="margin-bottom: 12px;">
                    <b>${p.part}.</b> ${p.description}
                  </p>
                `).join('')}
              </div>
            </div>`;
        }

        // ✅ PREPARE IMAGES FOR DATABASE (Map Cloudinary URLs to AI Placements)
        const dbImages = [];
        const placements = generatedContent.imagePlacements || {};
        const captions = generatedContent.imageCaptions || [];

        console.log('🖼️ Raw Placements from AI:', placements);

        // Inverted map: Index -> Section(s)
        const indexToSection = {};
        Object.entries(placements).forEach(([section, indices]) => {
            if (Array.isArray(indices)) {
                indices.forEach(idx => {
                    indexToSection[idx] = section;
                });
            }
        });

        console.log('🗺️ Index to Section Map:', indexToSection);

        uploadedImages.forEach((img, idx) => {
            const mappedSection = indexToSection[idx] || 'Additional Resources';
            console.log(`📌 Mapping Image ${idx}: ${img.url} -> ${mappedSection}`);

            dbImages.push({
                url: img.url,
                section: mappedSection, // Default if AI didn't place it
                caption: captions[idx] || `Figure ${idx + 1}`,
                uploadedAt: new Date()
            });
        });

        // Create worksheet document
        const worksheet = new Worksheet({
            userId: req.userId,
            templateId: template._id,
            topic,
            subject: subject || user.defaultSubject || template.subject,
            syllabus,
            difficulty: difficulty || 'medium',
            headerImageUrl, // Save header URL
            content: {
                // ✅ NEW FIELDS
                mainQuestionTitle: generatedContent.mainQuestionTitle || '',
                questionParts: generatedContent.questionParts || [],
                questionTitle: formattedQuestionTitle,

                aim: generatedContent.aim || '',
                problemStatement: generatedContent.problemStatement || '',
                dataset: generatedContent.dataset || '',
                algorithm: generatedContent.algorithm || '',
                objective: generatedContent.objective || [],
                code: (typeof generatedContent.code === 'string')
                    ? { language: 'plaintext', source: generatedContent.code, explanation: '' }
                    : {
                        language: generatedContent.code?.language || 'plaintext',
                        source: generatedContent.code?.source || generatedContent.code || '',
                        explanation: generatedContent.code?.explanation || ''
                    },
                output: generatedContent.output || '',
                conclusion: generatedContent.conclusion || '',
                learningOutcome: generatedContent.learningOutcome || [],
                imageAnalysis: generatedContent.imageAnalysis || null,
                additionalNotes: generatedContent.additionalNotes || ''
            },
            images: dbImages, // Save images with AI-determined context
            status: 'generated',
            experimentNumber: experimentNumber || 'N/A',
            dateOfPerformance: new Date()
        });

        await worksheet.save();

        // Update template usage
        await template.incrementUsage();

        // Update AI memory
        await aiMemory.updatePatterns(worksheet);

        res.status(201).json({
            success: true,
            message: 'Worksheet generated successfully',
            worksheet
        });
    } catch (error) {
        console.error('Generate worksheet error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate worksheet'
        });
    }
});

/**
 * @route   POST /api/worksheets/:id/upload-image
 * @desc    Upload image/screenshot for worksheet
 * @access  Private
 */
router.post('/:id/upload-image', auth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file uploaded'
            });
        }

        const { section, caption } = req.body;

        // Find worksheet
        const worksheet = await Worksheet.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!worksheet) {
            return res.status(404).json({
                success: false,
                message: 'Worksheet not found'
            });
        }

        // Upload image to Cloudinary
        const uploadResult = await cloudinaryService.uploadImage(
            req.file.buffer,
            req.userId.toString(),
            req.params.id
        );

        // Add image to worksheet
        worksheet.images.push({
            url: uploadResult.url,
            section: section || 'Output',
            caption: caption || 'Image'
        });

        await worksheet.save();

        res.json({
            success: true,
            message: 'Image uploaded successfully',
            image: {
                url: uploadResult.url,
                section: section || 'Output',
                caption: caption || 'Image'
            }
        });
    } catch (error) {
        console.error('Upload image error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload image'
        });
    }
});

/**
 * @route   PUT /api/worksheets/:id
 * @desc    Update worksheet content (manual edit)
 * @access  Private
 */
router.put('/:id', auth, async (req, res) => {
    try {
        const { content, experimentNumber, dateOfPerformance } = req.body;

        const worksheet = await Worksheet.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!worksheet) {
            return res.status(404).json({
                success: false,
                message: 'Worksheet not found'
            });
        }

        // Update content
        if (content) {
            worksheet.content = {
                ...worksheet.content,
                ...content
            };
        }

        if (experimentNumber) worksheet.experimentNumber = experimentNumber;
        if (dateOfPerformance) worksheet.dateOfPerformance = dateOfPerformance;

        // Increment version
        await worksheet.incrementVersion();

        res.json({
            success: true,
            message: 'Worksheet updated successfully',
            worksheet
        });
    } catch (error) {
        console.error('Update worksheet error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update worksheet'
        });
    }
});

/**
 * @route   POST /api/worksheets/:id/generate-pdf
 * @desc    Generate PDF from worksheet content
 * @access  Private
 */
router.post('/:id/generate-pdf', auth, async (req, res) => {
    try {
        console.log('Received PDF generation request for ID:', req.params.id);
        const worksheet = await Worksheet.findOne({
            _id: req.params.id,
            userId: req.userId
        }).populate('templateId');

        if (!worksheet) {
            return res.status(404).json({
                success: false,
                message: 'Worksheet not found'
            });
        }

        const user = await User.findById(req.userId);

        console.log('Generating PDF...');

        // Generate PDF
        const pdfBuffer = await pdfGeneratorService.generateWorksheetPDF(worksheet, user);

        // Upload to Cloudinary
        const uploadResult = await cloudinaryService.uploadGeneratedPDF(
            pdfBuffer,
            req.userId.toString(),
            req.params.id
        );

        // Update worksheet with PDF URL
        worksheet.pdfUrl = uploadResult.url;
        worksheet.status = 'finalized';
        await worksheet.save();

        res.json({
            success: true,
            message: 'PDF generated successfully',
            pdfUrl: uploadResult.url,
            pdfBase64: pdfBuffer.toString('base64')
        });
    } catch (error) {
        console.error('Generate PDF error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate PDF'
        });
    }
});

/**
 * @route   GET /api/worksheets/history
 * @desc    Get user's worksheet history
 * @access  Private
 */
router.get('/history', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const worksheets = await Worksheet.find({ userId: req.userId })
            .populate('templateId', 'templateName subject')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Worksheet.countDocuments({ userId: req.userId });

        res.json({
            success: true,
            count: worksheets.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            worksheets
        });
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get worksheet history'
        });
    }
});

/**
 * @route   GET /api/worksheets/:id
 * @desc    Get specific worksheet
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const worksheet = await Worksheet.findOne({
            _id: req.params.id,
            userId: req.userId
        }).populate('templateId');

        if (!worksheet) {
            return res.status(404).json({
                success: false,
                message: 'Worksheet not found'
            });
        }

        res.json({
            success: true,
            worksheet
        });
    } catch (error) {
        console.error('Get worksheet error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get worksheet'
        });
    }
});

/**
 * @route   POST /api/worksheets/:id/regenerate-section
 * @desc    Regenerate specific section of worksheet
 * @access  Private
 */
router.post('/:id/regenerate-section', auth, [
    body('section').notEmpty().withMessage('Section name is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { section } = req.body;

        const worksheet = await Worksheet.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!worksheet) {
            return res.status(404).json({
                success: false,
                message: 'Worksheet not found'
            });
        }

        // Map section names to content keys
        const sectionMap = {
            'Aim': 'aim',
            'Problem Statement': 'problemStatement',
            'Dataset': 'dataset',
            'Code': 'code',
            'Output': 'output'
        };

        const contentKey = sectionMap[section];
        if (!contentKey) {
            return res.status(400).json({
                success: false,
                message: 'Invalid section name'
            });
        }

        const currentContent = worksheet.content[contentKey];

        // Regenerate section with AI
        const newContent = await geminiService.regenerateSection(
            section,
            currentContent,
            {
                topic: worksheet.topic,
                syllabus: worksheet.syllabus
            }
        );

        // Update worksheet
        worksheet.content[contentKey] = newContent;
        await worksheet.incrementVersion();

        res.json({
            success: true,
            message: `${section} regenerated successfully`,
            newContent,
            worksheet
        });
    } catch (error) {
        console.error('Regenerate section error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to regenerate section'
        });
    }
});

export default router;
