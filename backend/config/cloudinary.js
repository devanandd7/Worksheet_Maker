import pkg from 'cloudinary';
const { v2: cloudinary } = pkg;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Verify configuration
const verifyCloudinaryConfig = () => {
    const { cloud_name, api_key, api_secret } = cloudinary.config();

    if (!cloud_name || !api_key || !api_secret) {
        console.warn('⚠️  Cloudinary configuration incomplete. Please set environment variables.');
        return false;
    }

    console.log('✅ Cloudinary configured successfully');
    return true;
};

verifyCloudinaryConfig();

export default cloudinary;
