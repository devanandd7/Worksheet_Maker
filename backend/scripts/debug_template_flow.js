import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import mongoose from 'mongoose';
import User from '../models/User.js';
import University from '../university/University.js';
import Template from '../models/Template.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    try {
        // 1. Get "CU" University
        const cu = await University.findOne({ name: 'CU' });
        if (!cu) {
            console.error('❌ University "CU" not found');
            return;
        }
        console.log(`✅ Found University: ${cu.name}, DefaultTemplateId: ${cu.defaultTemplateId}`);

        if (!cu.defaultTemplateId) {
            console.error('❌ University "CU" has no defaultTemplateId');
            return;
        }

        // 2. Check basic Template existence
        const t = await Template.findById(cu.defaultTemplateId);
        if (!t) {
            console.error('❌ Default Template object not found in DB');
        } else {
            console.log(`✅ Default Template exists: ${t.templateName}, University: ${t.university}`);
        }

        // 3. Simulate API Call (Get Suggestions)
        // We need a dummy user ID to simulate req.userId
        const user = await User.findOne({});
        const userId = user._id;

        const matchCondition = { university: cu.name };
        const query = {
            $or: [
                { userId: userId },
                matchCondition
            ],
            status: { $ne: 'invalid' }
        };

        console.log('--- Simulating API Query ---');
        console.log(JSON.stringify(query, null, 2));

        const templates = await Template.find(query)
            .sort({ createdAt: -1 })
            .limit(50);

        console.log(`✅ Found ${templates.length} templates`);

        const found = templates.find(tpl => tpl._id.toString() === cu.defaultTemplateId.toString());
        if (found) {
            console.log(`✅ Default Template IS present in API results.`);
        } else {
            console.log(`❌ Default Template IS NOT present in API results!`);
            console.log('Top 5 results:', templates.map(t => `${t.templateName} (${t._id})`).slice(0, 5));
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

run();
