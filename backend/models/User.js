import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    clerkId: {
        type: String,
        required: [true, 'Clerk ID is required'],
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    // Profile fields - now optional with defaults
    university: {
        type: String,
        default: 'Not Set',
        trim: true
    },
    course: {
        type: String,
        default: 'Not Set',
        trim: true
    },
    semester: {
        type: String,
        default: 'Not Set',
        trim: true
    },
    defaultSubject: {
        type: String,
        trim: true
    },
    uid: {
        type: String,
        trim: true
    },
    branch: {
        type: String,
        trim: true
    },
    section: {
        type: String,
        trim: true
    },
    headerImageUrl: {
        type: String,
        trim: true,
        default: null
    },
    headerImagePublicId: {
        type: String,
        trim: true,
        default: null
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    // Track if user has completed profile setup
    profileCompleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Method to check if password matches
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.__v;
    return user;
};

// Calculate profile completion percentage
userSchema.methods.calculateProfileCompletion = function () {
    const requiredFields = ['name', 'email', 'university', 'course', 'semester'];
    const optionalFields = ['section', 'branch', 'uid', 'defaultSubject'];

    let completedRequired = 0;
    const missingFields = [];

    // Check required fields
    requiredFields.forEach(field => {
        if (this[field] && this[field] !== 'Not Set' && this[field].trim() !== '') {
            completedRequired++;
        } else {
            missingFields.push(field);
        }
    });

    // Check optional fields
    const completedOptional = optionalFields.filter(field =>
        this[field] && this[field] !== '' && this[field].trim() !== ''
    ).length;

    // Calculate percentage: 80% weight for required, 20% for optional
    const requiredPercentage = (completedRequired / requiredFields.length) * 80;
    const optionalPercentage = (completedOptional / optionalFields.length) * 20;
    const totalPercentage = Math.round(requiredPercentage + optionalPercentage);

    return {
        percentage: totalPercentage,
        isComplete: totalPercentage >= 80,
        completedRequired,
        totalRequired: requiredFields.length,
        completedOptional,
        totalOptional: optionalFields.length,
        missingFields
    };
};

export default mongoose.model('User', userSchema);
