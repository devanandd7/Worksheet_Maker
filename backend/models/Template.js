import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
    templateName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    university: {
        type: String,
        required: true,
        trim: true
    },
    course: {
        type: String,
        required: true,
        trim: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    sectionsOrder: {
        type: [String],
        required: true,
        default: [
            'Aim',
            'Problem Statement',
            'Dataset',
            'Objective',
            'Code',
            'Output',
            'Learning Outcome'
        ]
    },
    style: {
        type: String,
        default: 'Formal Academic',
        enum: ['Formal Academic', 'Practical Oriented', 'Research Focused', 'Practical', 'Academic']
    },
    level: {
        type: String,
        default: 'Post Graduate',
        enum: ['Under Graduate', 'Post Graduate', 'Research', 'Postgraduate', 'Undergraduate', 'Masters', 'PhD']
    },
    createdFromSample: {
        type: Boolean,
        default: false
    },
    samplePdfUrl: {
        type: String
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    usageCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for fast template suggestions
templateSchema.index({ university: 1, course: 1, subject: 1 });

// Increment usage count
templateSchema.methods.incrementUsage = async function () {
    this.usageCount += 1;
    await this.save();
};

export default mongoose.model('Template', templateSchema);
