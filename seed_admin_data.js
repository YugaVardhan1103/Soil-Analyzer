const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Schemas (copied from server.js for standalone use)
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['farmer', 'expert', 'admin'], default: 'farmer' },
    status: { type: String, enum: ['active', 'blocked'], default: 'active' },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const soilAnalysisSchema = new mongoose.Schema({
    email: String,
    crop: String,
    n: Number,
    p: Number,
    k: Number,
    ph: Number,
    recommendations: [String],
    date: { type: Date, default: Date.now }
});
const SoilAnalysis = mongoose.model('SoilAnalysis', soilAnalysisSchema);

const advisorySchema = new mongoose.Schema({
    farmerEmail: String,
    expertEmail: String,
    message: String,
    status: { type: String, default: 'unread' },
    isBroadcast: { type: Boolean, default: false },
    date: { type: Date, default: Date.now }
});
const Advisory = mongoose.model('Advisory', advisorySchema);

const auditLogSchema = new mongoose.Schema({
    adminEmail: String,
    action: String,
    targetId: String,
    details: String,
    timestamp: { type: Date, default: Date.now }
});
const AuditLog = mongoose.model('AuditLog', auditLogSchema);

async function seedData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB...");

        // 1. Clear existing data (optional but recommended for a fresh state)
        // await User.deleteMany({});
        // await SoilAnalysis.deleteMany({});
        // await Advisory.deleteMany({});
        // await AuditLog.deleteMany({});

        const hashedPassword = await bcrypt.hash('password123', 10);

        // 2. Create Experts
        const experts = [
            { email: 'expert1@soil.com', password: hashedPassword, role: 'expert' },
            { email: 'expert2@soil.com', password: hashedPassword, role: 'expert' },
            { email: 'expert3@soil.com', password: hashedPassword, role: 'expert' }
        ];
        for (let e of experts) {
            await User.findOneAndUpdate({ email: e.email }, e, { upsert: true });
        }
        console.log("3 Experts created.");

        // 3. Create Farmers
        const farmers = [
            { email: 'farmer1@agri.com', password: hashedPassword, role: 'farmer' },
            { email: 'farmer2@agri.com', password: hashedPassword, role: 'farmer' },
            { email: 'farmer3@agri.com', password: hashedPassword, role: 'farmer' }
        ];
        for (let f of farmers) {
            await User.findOneAndUpdate({ email: f.email }, f, { upsert: true });
        }
        console.log("3 Farmers created.");

        // 4. Create Reports (Critical, Warning, Optimal)
        const reports = [
            { email: 'farmer1@agri.com', crop: 'tomatoes', n: 10, p: 5, k: 50, ph: 4.2, recommendations: ["CRITICAL: Apply Lime immediately.", "Add high-nitrogen fertilizer."] },
            { email: 'farmer2@agri.com', crop: 'wheat', n: 45, p: 35, k: 80, ph: 6.2, recommendations: ["WARNING: Nitrogen levels slightly low.", "Maintain current pH."] },
            { email: 'farmer3@agri.com', crop: 'rice', n: 100, p: 80, k: 120, ph: 6.8, recommendations: ["OPTIMAL: Soil is in excellent condition."] }
        ];
        await SoilAnalysis.insertMany(reports);
        console.log("3 Diverse reports created.");

        // 5. Create Audit Logs
        const logs = [
            { adminEmail: 'admin@soil.com', action: 'VERIFY_EXPERT', targetId: 'expert1@soil.com', details: 'Manual verification of credentials' },
            { adminEmail: 'admin@soil.com', action: 'BROADCAST', targetId: 'all', details: 'System maintenance scheduled' }
        ];
        await AuditLog.insertMany(logs);
        console.log("Initial audit logs created.");

        console.log("SEEDING COMPLETE!");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedData();
