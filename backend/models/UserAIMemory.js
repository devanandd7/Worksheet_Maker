import mongoose from 'mongoose';

const userAIMemorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    preferredStructure: {
        type: String,
        default: 'LAB_STYLE',
        enum: ['LAB_STYLE', 'THEORY_STYLE', 'RESEARCH_STYLE', 'MIXED']
    },
    writingDepth: {
        type: String,
        default: 'medium',
        enum: ['brief', 'medium', 'detailed', 'comprehensive']
    },
    variationLevel: {
        type: String,
        default: 'high',
        enum: ['low', 'medium', 'high', 'maximum']
    },
    commonMistakes: {
        type: [String],
        default: []
    },
    preferredCodeStyle: {
        type: String,
        enum: ['commented', 'clean', 'detailed'],
        default: 'commented'
    },
    learningPatterns: {
        averageTopicComplexity: { type: String, default: 'medium' },
        commonSubjects: { type: [String], default: [] },
        preferredExampleTypes: { type: [String], default: [] }
    },
    generationHistory: {
        totalGenerated: { type: Number, default: 0 },
        lastGeneratedAt: Date,
        favoriteTemplates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Template' }]
    }
}, {
    timestamps: true
});

// Update learning patterns
userAIMemorySchema.methods.updatePatterns = async function (worksheet) {
    // Increment generation count
    this.generationHistory.totalGenerated += 1;
    this.generationHistory.lastGeneratedAt = new Date();

    // Track common subjects
    if (worksheet.topic && !this.learningPatterns.commonSubjects.includes(worksheet.topic)) {
        this.learningPatterns.commonSubjects.push(worksheet.topic);
    }

    await this.save();
};

// Add mistake to memory
userAIMemorySchema.methods.addMistake = async function (mistake) {
    if (!this.commonMistakes.includes(mistake)) {
        this.commonMistakes.push(mistake);
        await this.save();
    }
};

export default mongoose.model('UserAIMemory', userAIMemorySchema);
