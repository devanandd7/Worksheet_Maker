import express from 'express';
import pdfService from '../services/pdfService.js';

const router = express.Router();

/**
 * @route   POST /api/test/pdf-download
 * @desc    Test PDF download from URL
 * @access  Public
 */
router.post('/pdf-download', async (req, res) => {
    try {
        const { pdfUrl } = req.body;

        if (!pdfUrl) {
            return res.status(400).json({
                success: false,
                message: 'pdfUrl is required in request body'
            });
        }

        console.log('🧪 Testing PDF download from:', pdfUrl);

        const extractedData = await pdfService.extractTextFromURL(pdfUrl);

        res.json({
            success: true,
            message: 'PDF downloaded and extracted successfully!',
            data: {
                pages: extractedData.pages,
                textLength: extractedData.text.length,
                preview: extractedData.text.substring(0, 500)
            }
        });
    } catch (error) {
        console.error('PDF download test error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            details: {
                errorType: error.constructor.name,
                statusCode: error.response?.status,
                statusText: error.response?.statusText
            }
        });
    }
});

export default router;
