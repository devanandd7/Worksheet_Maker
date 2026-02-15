import mongoose from 'mongoose';

const universitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'University name is required'],
        unique: true,
        trim: true
    },
    headerImageUrl: {
        type: String,
        required: [true, 'Header image is required']
    },
    headerImagePublicId: {
        type: String,
        required: true
    },
    sampleTemplateUrl: {
        type: String,
        required: [true, 'Sample template PDF is required']
    },
    sampleTemplatePublicId: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    analysisStatus: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    analysisError: {
        type: String
    },
    defaultTemplateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Template'
    }
}, {
    timestamps: true
});

export default mongoose.model('University', universitySchema);
