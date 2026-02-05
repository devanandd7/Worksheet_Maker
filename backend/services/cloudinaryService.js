import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';

class CloudinaryService {
    /**
     * Upload PDF file to Cloudinary
     * @param {Buffer} fileBuffer - PDF file buffer from multer
     * @param {String} filename - Original filename
     * @param {String} userId - User ID for folder organization
     * @returns {Promise<Object>} - Upload result with URL
     */
    async uploadPDF(fileBuffer, filename, userId) {
        try {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: `worksheet-ai/samples/${userId}`,
                        resource_type: 'raw',        // Correct for PDFs
                        public_id: `sample_${Date.now()}`,
                        use_filename: true,
                        unique_filename: false
                    },
                    (error, result) => {
                        if (error) {
                            console.error('Cloudinary PDF upload error:', error);
                            reject(error);
                        } else {
                            resolve({
                                url: result.secure_url,
                                publicId: result.public_id,
                                format: result.format,
                                bytes: result.bytes
                            });
                        }
                    }
                );

                const readableStream = new Readable();
                readableStream.push(fileBuffer);
                readableStream.push(null);
                readableStream.pipe(uploadStream);
            });
        } catch (error) {
            console.error('Upload PDF error:', error);
            throw new Error('Failed to upload PDF to Cloudinary');
        }
    }


    /**
     * Upload image to Cloudinary
     * @param {Buffer} fileBuffer - Image file buffer
     * @param {String} userId - User ID for folder organization
     * @param {String} worksheetId - Worksheet ID for organization
     * @returns {Promise<Object>} - Upload result with URL
     */
    async uploadImage(fileBuffer, userId, worksheetId) {
        try {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: `worksheet-ai/images/${userId}/${worksheetId}`,
                        resource_type: 'image',
                        transformation: [
                            { width: 1200, height: 1200, crop: 'limit' },
                            { quality: 'auto' },
                            { fetch_format: 'auto' }
                        ]
                    },
                    (error, result) => {
                        if (error) {
                            console.error('Cloudinary image upload error:', error);
                            reject(error);
                        } else {
                            resolve({
                                url: result.secure_url,
                                publicId: result.public_id,
                                width: result.width,
                                height: result.height,
                                format: result.format
                            });
                        }
                    }
                );

                const readableStream = new Readable();
                readableStream.push(fileBuffer);
                readableStream.push(null);
                readableStream.pipe(uploadStream);
            });
        } catch (error) {
            console.error('Upload image error:', error);
            throw new Error('Failed to upload image to Cloudinary');
        }
    }

    /**
     * Upload generated PDF worksheet to Cloudinary
     * @param {Buffer} pdfBuffer - Generated PDF buffer
     * @param {String} userId - User ID
     * @param {String} worksheetId - Worksheet ID
     * @returns {Promise<Object>} - Upload result with URL
     */
    async uploadGeneratedPDF(pdfBuffer, userId, worksheetId) {
        try {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: `worksheet-ai/generated/${userId}`,
                        resource_type: 'raw',
                        public_id: `worksheet_${worksheetId}_${Date.now()}`,
                        format: 'pdf',
                        access_mode: 'public'  // Make generated PDF publicly accessible
                    },
                    (error, result) => {
                        if (error) {
                            console.error('Cloudinary generated PDF upload error:', error);
                            reject(error);
                        } else {
                            resolve({
                                url: result.secure_url,
                                publicId: result.public_id,
                                bytes: result.bytes
                            });
                        }
                    }
                );

                const readableStream = new Readable();
                readableStream.push(pdfBuffer);
                readableStream.push(null);
                readableStream.pipe(uploadStream);
            });
        } catch (error) {
            console.error('Upload generated PDF error:', error);
            throw new Error('Failed to upload generated PDF to Cloudinary');
        }
    }

    /**
     * Delete file from Cloudinary
     * @param {String} publicId - Public ID of the file
     * @param {String} resourceType - Type of resource (image/raw)
     * @returns {Promise<Object>} - Deletion result
     */
    async deleteFile(publicId, resourceType = 'raw') {
        try {
            const result = await cloudinary.uploader.destroy(publicId, {
                resource_type: resourceType
            });
            return result;
        } catch (error) {
            console.error('Delete file error:', error);
            throw new Error('Failed to delete file from Cloudinary');
        }
    }
}

export default new CloudinaryService();
