import pdf from 'pdf-parse';

class PdfService {
    /**
     * Extract text from PDF buffer
     * @param {Buffer} buffer - PDF file buffer
     * @returns {Promise<string>} - Extracted text
     */
    async extractText(buffer) {
        try {
            const data = await pdf(buffer);

            // Clean up text
            // Remove multiple spaces, newlines, and non-printable characters
            const text = data.text
                .replace(/\n/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            return text;
        } catch (error) {
            console.error('PDF extraction error:', error);
            throw new Error(`Failed to extract text from PDF: ${error.message}`);
        }
    }

    /**
     * Validate if file buffer is a PDF
     * @param {Buffer} buffer 
     */
    isValidPDF(buffer) {
        // PDF magic number: %PDF- (25 50 44 46 2D)
        if (!buffer || buffer.length < 5) return false;
        return buffer.toString('utf8', 0, 5) === '%PDF-';
    }
}

export default new PdfService();
