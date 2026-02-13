import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/auth/sync-profile
 * @desc    Sync/update user profile after Clerk signup
 * @access  Private (Clerk authenticated)
 */
router.post('/sync-profile', auth, async (req, res) => {
    try {
        const { name, university, course, semester, defaultSubject, uid, branch, section } = req.body;

        // req.user already exists from auth middleware (auto-created if needed)
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update profile fields
        if (name) user.name = name;
        if (university) user.university = university;
        if (course) user.course = course;
        if (semester) user.semester = semester;
        if (defaultSubject !== undefined) user.defaultSubject = defaultSubject;
        if (uid !== undefined) user.uid = uid;
        if (branch !== undefined) user.branch = branch;
        if (section !== undefined) user.section = section;

        // Mark profile as completed if key fields are provided
        if (university && university !== 'Not Set' && course && course !== 'Not Set' && semester && semester !== 'Not Set') {
            user.profileCompleted = true;
        }

        await user.save();

        res.json({
            success: true,
            message: 'Profile synced successfully',
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Sync profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to sync profile'
        });
    }
});



/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, university, course, semester, defaultSubject, uid, branch, section } = req.body;

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update fields
        if (name) user.name = name;
        if (university) user.university = university;
        if (course) user.course = course;
        if (semester) user.semester = semester;
        if (defaultSubject !== undefined) user.defaultSubject = defaultSubject;
        if (uid !== undefined) user.uid = uid;
        if (branch !== undefined) user.branch = branch;
        if (section !== undefined) user.section = section;

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const completion = user.calculateProfileCompletion();

        res.json({
            success: true,
            user: {
                ...user.toJSON(),
                profileCompletion: completion
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * @route   POST /api/auth/upload-header
 * @desc    Upload or update user's header image (college/university logo)
 * @access  Private
 */
router.post('/upload-header', auth, async (req, res) => {
    try {
        const cloudinaryService = (await import('../services/cloudinaryService.js')).default;
        const upload = (await import('../config/multer.js')).default;

        // Use multer to handle file upload
        upload.single('headerImage')(req, res, async (err) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: 'File upload error: ' + err.message
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No header image file provided'
                });
            }

            try {
                const user = await User.findById(req.userId);
                if (!user) {
                    return res.status(404).json({
                        success: false,
                        message: 'User not found'
                    });
                }

                // Delete old header image from Cloudinary if exists
                if (user.headerImagePublicId) {
                    try {
                        await cloudinaryService.deleteResource(user.headerImagePublicId);
                        console.log(`✅ Deleted old header image: ${user.headerImagePublicId}`);
                    } catch (deleteError) {
                        console.error('Failed to delete old header:', deleteError);
                        // Continue anyway - don't fail upload if delete fails
                    }
                }

                // Upload new header image
                const uploadResult = await cloudinaryService.uploadImage(
                    req.file.buffer,
                    req.userId,
                    'headers'
                );

                // Update user with new header
                user.headerImageUrl = uploadResult.url;
                user.headerImagePublicId = uploadResult.publicId;
                await user.save();

                res.json({
                    success: true,
                    message: 'Header image uploaded successfully',
                    headerImageUrl: uploadResult.url
                });

            } catch (uploadError) {
                console.error('Header upload error:', uploadError);
                res.status(500).json({
                    success: false,
                    message: 'Failed to upload header image'
                });
            }
        });

    } catch (error) {
        console.error('Upload header error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * @route   DELETE /api/auth/delete-header
 * @desc    Delete user's header image
 * @access  Private
 */
router.delete('/delete-header', auth, async (req, res) => {
    try {
        const cloudinaryService = (await import('../services/cloudinaryService.js')).default;

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.headerImagePublicId) {
            return res.status(404).json({
                success: false,
                message: 'No header image to delete'
            });
        }

        // Delete from Cloudinary
        try {
            await cloudinaryService.deleteResource(user.headerImagePublicId);
            console.log(`✅ Deleted header image: ${user.headerImagePublicId}`);
        } catch (deleteError) {
            console.error('Failed to delete header from Cloudinary:', deleteError);
        }

        // Clear from user
        user.headerImageUrl = null;
        user.headerImagePublicId = null;
        await user.save();

        res.json({
            success: true,
            message: 'Header image deleted successfully'
        });

    } catch (error) {
        console.error('Delete header error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

export default router;
