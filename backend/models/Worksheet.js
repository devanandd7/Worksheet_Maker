import mongoose from 'mongoose';

const worksheetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Template',
        required: true
    },
    topic: {
        type: String,
        required: true,
        trim: true
    },
    subject: {
        type: String,
        default: 'Computer Science'
    },
    syllabus: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard', 'Easy', 'Medium', 'Hard'],
        default: 'medium'
    },
    content: {
        aim: { type: String, default: '' },
        problemStatement: { type: String, default: '' },
        dataset: { type: String, default: '' },
        algorithm: { type: String, default: '' },
        objective: { type: [String], default: [] },
        code: { type: String, default: '' },
        output: { type: String, default: '' },
        conclusion: { type: String, default: '' },
        learningOutcome: { type: [String], default: [] }
    },
    images: [{
        url: String,
        section: String,
        caption: String,
        uploadedAt: { type: Date, default: Date.now }
    }],
    pdfUrl: {
        type: String
    },
    version: {
        type: Number,
        default: 1
    },
    status: {
        type: String,
        enum: ['draft', 'generated', 'edited', 'finalized'],
        default: 'draft'
    },
    experimentNumber: {
        type: String
    },
    dateOfPerformance: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for user history queries
worksheetSchema.index({ userId: 1, createdAt: -1 });

// Update version on edit
worksheetSchema.methods.incrementVersion = async function () {
    this.version += 1;
    this.status = 'edited';
    await this.save();
};

export default mongoose.model('Worksheet', worksheetSchema);
