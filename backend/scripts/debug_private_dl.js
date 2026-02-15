import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const PUBLIC_ID = 'worksheet-ai/universities/phw4nzyc45ydn6iv8aug';

async function checkUrl(label, url) {
    console.log(`Testing ${label}: ${url}`);
    try {
        const res = await axios.head(url);
        console.log(`✅ [${label}] Success: ${res.status}`);
    } catch (e) {
        console.log(`❌ [${label}] Failed: ${e.response?.status || e.message}`);
    }
}

async function testPrivateDownload() {
    console.log(`Testing Private Download for: ${PUBLIC_ID}`);

    try {
        // 1. Standard Private Download URL (for 'upload' type)
        const url1 = cloudinary.utils.private_download_url(PUBLIC_ID, 'pdf', {
            type: 'upload',
            attachment: false,
            expires_at: Math.floor(Date.now() / 1000) + 3600
        });
        await checkUrl('Type: Upload', url1);

        // 2. Private Download URL (for 'authenticated' type - just in case)
        const url2 = cloudinary.utils.private_download_url(PUBLIC_ID, 'pdf', {
            type: 'authenticated',
            attachment: false,
            expires_at: Math.floor(Date.now() / 1000) + 3600
        });
        await checkUrl('Type: Authenticated', url2);

    } catch (error) {
        console.error('Error generating URL:', error);
    }
}

testPrivateDownload();
