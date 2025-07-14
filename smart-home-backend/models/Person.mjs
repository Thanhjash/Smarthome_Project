import mongoose from 'mongoose';

const personSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    registered: {
        type: Boolean,
        default: false
    },
    registeredAt: {
        type: Date,
        default: Date.now
    },
    lastSeen: {
        type: Date
    },
    accessLevel: {
        type: String,
        enum: ['guest', 'resident', 'admin'],
        default: 'guest'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

export default mongoose.model('Person', personSchema);