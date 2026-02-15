
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Worksheet from './models/Worksheet.js';
import User from './models/User.js';
import University from './university/University.js';

dotenv.config();

async function debugDashboard() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected');

        const usersCount = await User.countDocuments();
        const worksheetsCount = await Worksheet.countDocuments();
        const unisCount = await University.countDocuments();

        console.log(`Summary: Users=${usersCount}, Worksheets=${worksheetsCount}, Unis=${unisCount}`);

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        console.log('Start of month:', startOfMonth);

        const monthlyUsage = await Worksheet.countDocuments({
            createdAt: { $gte: startOfMonth }
        });
        console.log('Monthly usage count:', monthlyUsage);

        if (worksheetsCount > 0) {
            const latest = await Worksheet.findOne().sort({ createdAt: -1 });
            console.log('Latest worksheet created at:', latest.createdAt);
        }

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminUser = await User.findOne({ email: adminEmail });
        if (adminUser) {
            console.log(`Admin user found in DB: ${adminUser.email} (ID: ${adminUser._id})`);
        } else {
            console.log(`❌ Admin user NOT found in DB with email: ${adminEmail}`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Debug failed:', err);
        process.exit(1);
    }
}

debugDashboard();
