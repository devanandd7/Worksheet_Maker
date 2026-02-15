import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import University from '../backend/university/University.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend/.env
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const checkUniversities = async () => {
    try {
        console.log('Connecting to MongoDB...', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected');

        console.log('Fetching universities...');
        const universities = await University.find({});
        console.log(`Found ${universities.length} universities.`);

        universities.forEach(u => {
            console.log(`- ${u.name} (ID: ${u._id}, Active: ${u.isActive})`);
            console.log(`  Header: ${u.headerImageUrl}`);
            console.log(`  Sample: ${u.sampleTemplateUrl}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
};

checkUniversities();
