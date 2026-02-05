import express from 'express';
import geminiService from '../services/geminiService.js';

const router = express.Router();

/**
 * @route   GET /api/test/gemini
 * @desc    Test if Gemini AI is working
 * @access  Public
 */
router.get('/gemini', async (req, res) => {
    try {
        // Use the testConnection method from geminiService
        const result = await geminiService.testConnection();

        res.json({
            success: true,
            message: 'Gemini AI is working perfectly!',
            apiKeyValid: true,
            model: result.model,
            testResponse: result.message
        });
    } catch (error) {
        console.error('Gemini test error:', error);
        res.status(500).json({
            success: false,
            message: 'Gemini AI test failed',
            apiKeyValid: false,
            error: error.message
        });
    }
});

export default router;
