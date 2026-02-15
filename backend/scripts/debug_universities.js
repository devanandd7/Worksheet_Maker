import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import University from '../university/University.js';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error(err));

async function checkUrl(label, url) {
    try {
        const res = await axios.head(url);
        console.log(`✅ [${label}] Success: ${res.status}`);
        return true;
    } catch (e) {
        console.log(`❌ [${label}] Failed: ${e.response?.status || e.message}`);
        return false;
    }
}

async function checkUniversities() {
    try {
        const university = await University.findOne({ sampleTemplatePublicId: { $ne: null } });
        if (!university) {
            console.log('No university with sample PDF found.');
            return;
        }

        console.log(`Testing with University: ${university.name}`);
        console.log(`Public ID: ${university.sampleTemplatePublicId}`);

        // ... (previous code) ...
        console.log(`University: ${university.name}`);

        // Inspect Resource to get exact HTTP URL
        try {
            let resource = await cloudinary.api.resource(university.sampleTemplatePublicId, { resource_type: 'image' });
            if (resource && resource.url) {
                console.log(`Testing HTTP URL: ${resource.url}`);
                const access = await checkUrl('HTTP URL (Unsigned)', resource.url);
                if (access) console.log(`!!! SUCCESS FOUND: HTTP URL !!!`);
            }
        } catch (e) {
            console.log('Resource check failed', e.message);
        }

        console.log('--- Inspecting Resource with Cloudinary Admin API ---');
        try {
            // Try to find it as 'image' first (most likely for PDF)
            let resource = await cloudinary.api.resource(university.sampleTemplatePublicId, { resource_type: 'image' });
            console.log('✅ Found as IMAGE:');
            console.log(JSON.stringify(resource, null, 2));
        } catch (e) {
            console.log('❌ Not found as IMAGE:', e.message);
            try {
                // Try as 'raw'
                let resource = await cloudinary.api.resource(university.sampleTemplatePublicId, { resource_type: 'raw' });
                console.log('✅ Found as RAW:');
                console.log(JSON.stringify(resource, null, 2));
            } catch (e2) {
                console.log('❌ Not found as RAW:', e2.message);
            }
        }
        // Extract version from existing URL if possible
        const versionMatch = university.sampleTemplateUrl.match(/\/v(\d+)\//);
        const version = versionMatch ? versionMatch[1] : undefined;

        const configs = [
            { label: 'Upload + Image + PDF (Signed, Versioned)', options: { resource_type: 'image', type: 'upload', sign_url: true, format: 'pdf', version } },
            { label: 'Upload + Image + PDF (Signed, No Version)', options: { resource_type: 'image', type: 'upload', sign_url: true, format: 'pdf' } }, // Omit version
            { label: 'Upload + Image (Signed, No Ver, No Fmt)', options: { resource_type: 'image', type: 'upload', sign_url: true } },
            { label: 'Upload + Raw + PDF (Signed, Versioned)', options: { resource_type: 'raw', type: 'upload', sign_url: true, format: 'pdf', version } },
            { label: 'Authenticated + Image + PDF (Signed, Versioned)', options: { resource_type: 'image', type: 'authenticated', sign_url: true, format: 'pdf', version } },
        ];

        for (const config of configs) {
            const url = cloudinary.url(university.sampleTemplatePublicId, {
                ...config.options,
                sign_url: true, // redundancy
                secure: true,
                expires_at: Math.floor(Date.now() / 1000) + 3600
            });
            console.log(`Test: ${config.label}`);
            // console.log(`URL: ${url}`);
            const access = await checkUrl(config.label, url);
            if (access) console.log(`!!! SUCCESS FOUND: ${config.label} !!!`);
        }

        // 2. Upload a Test PDF as AUTHENTICATED
        console.log('--- Attempting Test Upload (Authenticated) ---');
        try {
            // Create a minimal PDF buffer (Start/EOF)
            const pdfBuffer = Buffer.from('%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000111 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF');

            const uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: 'image',
                        type: 'authenticated', // KEY CHANGE
                        folder: 'worksheet-ai/test',
                        format: 'pdf',
                        access_mode: 'authenticated'
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                stream.end(pdfBuffer);
            });

            console.log('✅ Uploaded Test PDF:', uploadResult.public_id);
            console.log('Type:', uploadResult.type);

            // 3. Generate Signed URL for Test PDF
            // Note: For authenticated resources, we MUST sign the URL
            const testSignedUrl = cloudinary.url(uploadResult.public_id, {
                resource_type: 'image',
                type: 'authenticated',
                sign_url: true,
                secure: true,
                version: uploadResult.version,
                expires_at: Math.floor(Date.now() / 1000) + 3600
            });
            console.log(`Testing Signed Authenticated URL: ${testSignedUrl}`);
            await checkUrl('Signed Authenticated URL', testSignedUrl);

            // Cleanup
            await cloudinary.api.delete_resources([uploadResult.public_id], { type: 'authenticated' });
            console.log('Cleaned up test file.');

        } catch (e) {
            console.error('Test upload failed:', e);
        }

        // 4. Test private_download_url which is specific for backend access
        console.log('--- Testing private_download_url ---');
        try {
            const privateUrl = cloudinary.utils.private_download_url(university.sampleTemplatePublicId, 'pdf', {
                type: 'upload', // original was upload
                attachment: false
            });
            console.log(`Testing Private Download URL: ${privateUrl}`);
            await checkUrl('Private Download URL', privateUrl);

        } catch (e) {
            console.log('Private download generation failed:', e.message);
        }


    } catch (error) {
        console.error(error);
    } finally {
        mongoose.disconnect();
    }
}

checkUniversities();
