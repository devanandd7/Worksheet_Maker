import multer from 'multer';
import path from 'path';

// Memory storage for direct upload to Cloudinary
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
    // Allowed file types
    const allowedPdfTypes = /pdf/;
    const allowedImageTypes = /jpeg|jpg|png|gif|webp/;

    const extname = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype;

    if (file.fieldname === 'pdf') {
        // PDF upload
        if (mimetype === 'application/pdf' && extname === '.pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed for sample worksheets'), false);
        }
    } else if (file.fieldname === 'image') {
        // Image upload
        if (allowedImageTypes.test(mimetype) && allowedImageTypes.test(extname.substring(1))) {
            cb(null, true);
        } else {
            cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
        }
    } else {
        cb(null, true);
    }
};

// Multer configuration
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: fileFilter
});

export default upload;
