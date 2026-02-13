import { clerkClient } from '@clerk/clerk-sdk-node';
import User from '../models/User.js';
import UserAIMemory from '../models/UserAIMemory.js';

const auth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            console.log('❌ No token provided in request');
            return res.status(401).json({
                success: false,
                message: 'No authentication token, access denied'
            });
        }

        // Verify Clerk session token
        let session;
        try {
            // console.log('🔍 Verifying token:', token.substring(0, 10) + '...');

            // For Clerk SDK v4.x
            const verifiedToken = await clerkClient.verifyToken(token);

            // verifiedToken contains the claims including 'sub' which is the user ID
            session = {
                userId: verifiedToken.sub,
                claims: verifiedToken
            };

            // console.log('✅ Token verified, UserID:', session.userId);
        } catch (clerkError) {
            console.error('❌ Clerk verification failed:', clerkError.message);
            return res.status(401).json({
                success: false,
                message: 'Invalid session/token: ' + clerkError.message
            });
        }

        if (!session) {
            return res.status(401).json({
                success: false,
                message: 'Invalid session'
            });
        }

        // Get Clerk user details
        const clerkUser = await clerkClient.users.getUser(session.userId);

        // Find or create MongoDB user
        let user = await User.findOne({ clerkId: clerkUser.id });

        if (!user) {
            // Auto-create user on first API call
            const emailAddress = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId);
            const email = emailAddress?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;

            const firstName = clerkUser.firstName || '';
            const lastName = clerkUser.lastName || '';
            const name = `${firstName} ${lastName}`.trim() || 'User';

            user = await User.create({
                clerkId: clerkUser.id,
                email: email,
                name: name,
                university: 'Not Set',
                course: 'Not Set',
                semester: 'Not Set',
                profileCompleted: false
            });

            // Create AI memory for new user
            await UserAIMemory.create({
                userId: user._id,
                preferredStructure: 'LAB_STYLE',
                writingDepth: 'medium',
                variationLevel: 'high'
            });

            console.log(`✅ New user created from Clerk: ${email}`);
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Attach user to request
        req.user = user;
        req.userId = user._id;
        req.clerkUserId = clerkUser.id;

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

export default auth;
