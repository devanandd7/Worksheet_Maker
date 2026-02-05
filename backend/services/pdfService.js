import pdf from 'pdf-parse';
import axios from 'axios';

class PDFService {
    /**
     * Extract text from PDF buffer
     * @param {Buffer} pdfBuffer - PDF file buffer
     * @returns {Promise<Object>} - Extracted text and metadata
     */
    async extractTextFromPDF(pdfBuffer) {
        try {
            const data = await pdf(pdfBuffer);

            return {
                text: data.text,
                pages: data.numpages,
                info: data.info,
                metadata: data.metadata
            };
        } catch (error) {
            console.error('PDF extraction error:', error);
            throw new Error('Failed to extract text from PDF. File may be corrupted or scanned.');
        }
    }

    /**
     * Extract text from PDF URL (Cloudinary)
     * @param {String} pdfUrl - URL of the PDF
     * @returns {Promise<Object>} - Extracted text and metadata
     */
    async extractTextFromURL(pdfUrl) {
        try {
            console.log('📥 Downloading PDF from:', pdfUrl);

            // Download PDF from URL
            const response = await axios.get(pdfUrl, {
                responseType: 'arraybuffer',
                timeout: 30000, // 30 second timeout
                maxContentLength: 50 * 1024 * 1024 // 50MB max
            });

            console.log('✅ PDF downloaded, size:', response.data.byteLength, 'bytes');

            const pdfBuffer = Buffer.from(response.data);
            return await this.extractTextFromPDF(pdfBuffer);
        } catch (error) {
            console.error('PDF URL extraction error:', {
                message: error.message,
                url: pdfUrl,
                status: error.response?.status,
                statusText: error.response?.statusText
            });
            throw new Error(`Failed to download or extract PDF from URL: ${error.message}`);
        }
    }

    /**
     * Validate PDF structure (basic checks)
     * @param {Object} extractedData - Data from extractTextFromPDF
     * @returns {Object} - Validation result
     */
    validatePDFStructure(extractedData) {
        const { text, pages } = extractedData;

        const issues = [];

        // Check if PDF has content
        if (!text || text.trim().length < 100) {
            issues.push('PDF appears to be empty or scanned (no extractable text)');
        }

        // Check minimum length
        if (text.length < 200) {
            issues.push('PDF content is too short to be a valid worksheet');
        }

        // Check for common section keywords
        const commonSections = ['aim', 'objective', 'code', 'output', 'problem', 'result'];
        const hasSection = commonSections.some(section =>
            text.toLowerCase().includes(section)
        );

        if (!hasSection) {
            issues.push('PDF does not appear to contain standard worksheet sections');
        }

        return {
            isValid: issues.length === 0,
            issues: issues,
            confidence: issues.length === 0 ? 'high' : 'low'
        };
    }

    /**
     * Detect sections from extracted text
     * @param {String} text - Extracted PDF text
     * @returns {Array} - Detected sections in order
     */
    detectSections(text) {
        const sectionPatterns = [
            { name: 'Aim', patterns: [/aim\s*:?/i, /purpose\s*:?/i, /overview\s*:?/i] },
            { name: 'Problem Statement', patterns: [/problem\s*statement\s*:?/i, /problem\s*:?/i, /question\s*:?/i] },
            { name: 'Dataset', patterns: [/dataset\s*:?/i, /data\s*set\s*:?/i, /data\s*:?/i] },
            { name: 'Objective', patterns: [/objective[s]?\s*:?/i, /goal[s]?\s*:?/i] },
            { name: 'Code', patterns: [/code\s*:?/i, /program\s*:?/i, /implementation\s*:?/i, /algorithm\s*:?/i] },
            { name: 'Output', patterns: [/output\s*:?/i, /result[s]?\s*:?/i, /execution\s*:?/i] },
            { name: 'Learning Outcome', patterns: [/learning\s*outcome[s]?\s*:?/i, /conclusion\s*:?/i, /learning[s]?\s*:?/i] }
        ];

        const detectedSections = [];

        sectionPatterns.forEach(section => {
            for (const pattern of section.patterns) {
                if (pattern.test(text)) {
                    if (!detectedSections.includes(section.name)) {
                        detectedSections.push(section.name);
                    }
                    break;
                }
            }
        });

        return detectedSections.length > 0 ? detectedSections : [
            'Aim',
            'Problem Statement',
            'Dataset',
            'Objective',
            'Code',
            'Output',
            'Learning Outcome'
        ];
    }
}

export default new PDFService();
