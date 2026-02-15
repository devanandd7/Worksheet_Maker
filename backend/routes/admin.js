import express from 'express';
import User from '../models/User.js';
import Worksheet from '../models/Worksheet.js';
import Template from '../models/Template.js';
import University from '../university/University.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Middleware to check if user is admin
const adminCheck = (req, res, next) => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL;

        if (!adminEmail) {
            console.error('❌ ERROR: ADMIN_EMAIL not configured in .env');
            return res.status(500).json({
                success: false,
                message: 'Admin email not configured on server'
            });
        }

        if (!req.user || !req.user.email) {
            console.error('❌ ERROR: User object missing in request after auth middleware');
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: User data missing'
            });
        }

        if (req.user.email.toLowerCase() !== adminEmail.toLowerCase()) {
            console.log(`🚫 ACCESS DENIED: ${req.user.email} attempted to access admin routes (Admin is: ${adminEmail})`);
            return res.status(403).json({
                success: false,
                message: 'Access denied: You are not an admin'
            });
        }

        next();
    } catch (error) {
        console.error('❌ Admin check internal error:', error);
        res.status(500).json({ success: false, message: 'Internal server error during admin check' });
    }
};

/**
 * @route   GET /api/admin/stats
 * @desc    Get system statistics
 * @access  Admin only
 */
router.get('/stats', auth, adminCheck, async (req, res) => {
    try {
        console.log('📊 Admin stats request received from:', req.user.email);
        const userCount = await User.countDocuments();
        const totalWorksheets = await Worksheet.countDocuments();
        const totalUniversities = await University.countDocuments();

        // Calculate Monthly Usage (Worksheets generated this month)
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthlyUsage = await Worksheet.countDocuments({
            createdAt: { $gte: startOfMonth }
        });

        console.log(`✅ Stats fetched: Users=${userCount}, MonthlyUsage=${monthlyUsage}, Worksheets=${totalWorksheets}, Unis=${totalUniversities}`);

        res.json({
            success: true,
            stats: {
                totalUsers: userCount,
                monthlyUsage,
                totalWorksheets,
                totalUniversities,
                timestamp: new Date()
            }
        });
    } catch (error) {
        console.error('❌ Admin stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching stats'
        });
    }
});


/**
 * @route   GET /api/admin/users
 * @desc    Get paginated list of users
 * @access  Admin only
 */
router.get('/users', auth, adminCheck, async (req, res) => {
    try {
        console.log('👥 Admin users request received from:', req.user.email);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const users = await User.find()
            .select('-__v') // Exclude version key
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments();
        console.log(`✅ Users fetched: count=${users.length}, total=${total}`);

        res.json({
            success: true,
            users,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total,
                hasMore: skip + users.length < total
            }
        });
    } catch (error) {
        console.error('❌ Admin users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching users'
        });
    }
});

export default router;
