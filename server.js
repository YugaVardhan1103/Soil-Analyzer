const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// MongoDB Connection
const seedFarmers = async () => {
    const data = [
        // Admin
        { email: 'admin@soil.com', password: 'admin123', role: 'admin' },
        
        // Expert (1)
        { email: 'admin@expert.com', password: 'password123', role: 'expert' },

        // Farmers (9)
        { email: 'john@farmer.com', password: 'password123', role: 'farmer' },
        { email: 'sarah@farmer.com', password: 'password123', role: 'farmer' },
        { email: 'michael@farmer.com', password: 'password123', role: 'farmer' },
        { email: 'emma@farmer.com', password: 'password123', role: 'farmer' },
        { email: 'david@farmer.com', password: 'password123', role: 'farmer' },
        { email: 'lisa@farmer.com', password: 'password123', role: 'farmer' },
        { email: 'james@farmer.com', password: 'password123', role: 'farmer' },
        { email: 'robert@farmer.com', password: 'password123', role: 'farmer' },
        { email: 'mary@farmer.com', password: 'password123', role: 'farmer' }
    ];

    try {
        // Full System Reset: Clear all collections to ensure data integrity
        await User.deleteMany({}); 
        await AuditLog.deleteMany({}); 
        await SoilAnalysis.deleteMany({});
        await Advisory.deleteMany({});
        
        // Seed Users
        for (let u of data) {
            const hashedPassword = await bcrypt.hash(u.password, 10);
            await new User({ ...u, password: hashedPassword }).save();
            console.log(`SEEDED USER: ${u.email}`);
        }

        // Seed 15 fresh reports ONLY for April (System Launch Month)
        const now = new Date();
        const getAprDay = (day) => new Date(now.getFullYear(), 3, day);

        const reports = [
            { email: 'john@farmer.com', crop: 'Rice', n: 25, p: 15, k: 40, ph: 5.2, date: getAprDay(1) },
            { email: 'sarah@farmer.com', crop: 'Rice', n: 26, p: 16, k: 41, ph: 5.3, date: getAprDay(5) },
            { email: 'james@farmer.com', crop: 'Rice', n: 22, p: 14, k: 38, ph: 5.1, date: getAprDay(10) },
            { email: 'sarah@farmer.com', crop: 'Wheat', n: 45, p: 35, k: 50, ph: 6.2, date: getAprDay(2) },
            { email: 'michael@farmer.com', crop: 'Cotton', n: 70, p: 45, k: 60, ph: 7.0, date: getAprDay(3) },
            { email: 'lisa@farmer.com', crop: 'Sugarcane', n: 80, p: 50, k: 70, ph: 7.2, date: getAprDay(4) },
            { email: 'emma@farmer.com', crop: 'Tomatoes', n: 20, p: 10, k: 30, ph: 4.8, date: getAprDay(7) },
            { email: 'david@farmer.com', crop: 'Maize', n: 40, p: 30, k: 45, ph: 5.8, date: getAprDay(14) },
            { email: 'mary@farmer.com', crop: 'Groundnut', n: 48, p: 38, k: 48, ph: 6.1, date: getAprDay(28) },
            { email: 'robert@farmer.com', crop: 'Soybean', n: 55, p: 40, k: 55, ph: 6.5, date: getAprDay(20) },
            { email: 'james@farmer.com', crop: 'Chilli', n: 15, p: 8, k: 25, ph: 5.0, date: getAprDay(18) },
            { email: 'lisa@farmer.com', crop: 'Sugarcane', n: 78, p: 48, k: 68, ph: 7.1, date: getAprDay(25) },
            { email: 'sarah@farmer.com', crop: 'Wheat', n: 48, p: 38, k: 62, ph: 6.3, date: getAprDay(26) },
            { email: 'john@farmer.com', crop: 'Rice', n: 24, p: 15, k: 39, ph: 5.2, date: getAprDay(20) },
            { email: 'mary@farmer.com', crop: 'Wheat', n: 44, p: 34, k: 48, ph: 6.1, date: getAprDay(22) }
        ];

        await SoilAnalysis.insertMany(reports);
        console.log("SEEDED: 15 reports for April only (System Launch).");

        // Seed some advisories to make the KPIs "real"
        const savedReports = await SoilAnalysis.find().limit(6);
        const advisories = savedReports.map((r, i) => ({
            farmerEmail: r.email,
            expertEmail: 'admin@expert.com',
            reportId: r._id,
            message: `Sample Advisory ${i+1}: Your soil Nitrogen is ${r.n}. Please use organic fertilizer.`,
            status: i % 2 === 0 ? 'read' : 'unread',
            date: new Date()
        }));

        await Advisory.insertMany(advisories);
        console.log("SEEDED: 6 advisories for real KPI tracking.");

    } catch (e) { console.error("SEED_ERROR:", e); }
};

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("DATABASE_CONNECTED: MongoDB Compass ready.");
        // Only seed if specifically requested via ENV (e.g. first run or demo mode)
if (process.env.SEED_DB === 'true') {
    seedFarmers();
}
    })
    .catch(err => console.error("DATABASE_CONNECTION_ERROR:", err));

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['farmer', 'expert', 'admin'], default: 'farmer' },
    status: { type: String, enum: ['active', 'blocked'], default: 'active' },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// Soil Analysis Schema
const soilAnalysisSchema = new mongoose.Schema({
    email: String,
    crop: String,
    n: Number,
    p: Number,
    k: Number,
    ph: Number,
    recommendations: [String],
    rating: { type: Number, default: 0 },
    feedback: { type: String, default: "" },
    date: { type: Date, default: Date.now }
});

// Computed Status for filtering
soilAnalysisSchema.virtual('healthStatus').get(function() {
    if (this.n < 30 || this.p < 20 || this.ph < 5.5 || this.ph > 8.5) return 'critical';
    if (this.n < 50 || this.p < 40 || this.ph < 6.0 || this.ph > 8.0) return 'warning';
    return 'optimal';
});
soilAnalysisSchema.set('toObject', { virtuals: true });
soilAnalysisSchema.set('toJSON', { virtuals: true });

const SoilAnalysis = mongoose.model('SoilAnalysis', soilAnalysisSchema);

// Advisory Schema (Expert → Farmer)
const advisorySchema = new mongoose.Schema({
    farmerEmail: { type: String, required: true },
    expertEmail: { type: String, required: true },
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'SoilAnalysis' },
    message: { type: String, required: true },
    status: { type: String, default: 'unread', enum: ['unread', 'read'] },
    isBroadcast: { type: Boolean, default: false },
    date: { type: Date, default: Date.now }
});
const Advisory = mongoose.model('Advisory', advisorySchema);

// Audit Log Schema
const auditLogSchema = new mongoose.Schema({
    adminEmail: String,
    action: String,
    targetId: String,
    details: String,
    timestamp: { type: Date, default: Date.now }
});
const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// --- MIDDLEWARE ---
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    res.status(403).json({ error: "Access denied. Admins only." });
};

const isExpert = (req, res, next) => {
    if (req.user && (req.user.role === 'expert' || req.user.role === 'admin')) {
        return next();
    }
    res.status(403).json({ error: "Access denied. Experts only." });
};

// Passport Serialization
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ email: profile.emails[0].value });
        if (!user) {
            user = new User({
                email: profile.emails[0].value,
                password: 'social-login-placeholder'
            });
            await user.save();
        }
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

// Facebook Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "/auth/facebook/callback",
    profileFields: ['id', 'emails', 'name']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let email = profile.emails ? profile.emails[0].value : `${profile.id}@facebook.com`;
        let user = await User.findOne({ email });
        if (!user) {
            user = new User({
                email: email,
                password: 'social-login-placeholder'
            });
            await user.save();
        }
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

// --- SOCIAL AUTH ROUTES ---
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login.html' }), (req, res) => {
    res.redirect(`/auth-success?email=${req.user.email}`);
});

app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login.html' }), (req, res) => {
    res.redirect(`/auth-success?email=${req.user.email}`);
});

// Helper for social login success
app.get('/auth-success', (req, res) => {
    const email = req.query.email;
    const role = email.endsWith('@admin.com') ? 'admin' : (email.endsWith('@expert.com') ? 'expert' : 'farmer');
    res.send(`
        <script>
            localStorage.setItem('loggedIn', 'true');
            localStorage.setItem('userEmail', '${email}');
            const role = '${role}';
            if (role === 'admin') window.location.href = 'admin_dashboard.html';
            else if (role === 'expert') window.location.href = 'expert_dashboard.html';
            else window.location.href = 'index.html';
        </script>
    `);
});


// --- AUTHENTICATION ENDPOINTS ---

app.post('/api/auth/signup', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: "Database not ready. Please wait a moment and try again." });
    }
    try {
        const { email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "User already exists." });

        const hashedPassword = await bcrypt.hash(password, 10);
        const role = email.endsWith('@admin.com') ? 'admin' : (email.endsWith('@expert.com') ? 'expert' : 'farmer');
        
        const newUser = new User({ email, password: hashedPassword, role });
        await newUser.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Signup failed." });
    }
});

app.post('/api/auth/login', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: "Database not ready. Please wait a moment and try again." });
    }
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) return res.status(401).json({ error: "Invalid email or password." });
        if (user.status === 'blocked') return res.status(403).json({ error: "Your account has been blocked. Contact support." });

        // Check if password is hashed (legacy support)
        const isMatch = user.password.startsWith('$2') 
            ? await bcrypt.compare(password, user.password)
            : user.password === password;

        if (!isMatch) return res.status(401).json({ error: "Invalid email or password." });

        // Passport login
        req.login(user, (err) => {
            if (err) return res.status(500).json({ error: "Session creation failed." });
            res.json({ success: true, email: user.email, role: user.role });
        });
    } catch (err) {
        res.status(500).json({ error: "Login failed." });
    }
});

app.post('/api/analyze', async (req, res) => {
    const { n, p, k, ph, crop, email } = req.body;
    let recommendations = [];

    const N = parseFloat(n);
    const P = parseFloat(p);
    const K = parseFloat(k);
    const PH = parseFloat(ph);

    // Input Validation
    if (isNaN(N) || isNaN(P) || isNaN(K) || isNaN(PH)) {
        return res.json({ results: ["[!] Error: Please enter numeric values for all soil parameters."] });
    }
    if (N < 0 || P < 0 || K < 0) {
        return res.json({ results: ["[!] Error: Nutrient levels (N-P-K) cannot be negative. Please check your data."] });
    }
    if (PH < 0 || PH > 14) {
        return res.json({ results: ["[!] Error: Invalid pH value. The pH scale must be between 0 and 14."] });
    }

    const CROP_DATA = {
        generic: { name: "General Crops", n: [30, 150, 150], p: [20, 100, 100], k: [40, 150, 150], ph: [6.0, 7.5] },
        tomatoes: { name: "Tomatoes", n: [50, 120, 150], p: [40, 100, 120], k: [80, 180, 200], ph: [6.0, 6.8] },
        corn: { name: "Corn", n: [80, 200, 250], p: [30, 80, 100], k: [50, 120, 150], ph: [5.8, 7.0] },
        rice: { name: "Rice", n: [40, 100, 120], p: [20, 60, 80], k: [30, 80, 100], ph: [5.5, 6.5] },
        wheat: { name: "Wheat", n: [60, 150, 180], p: [30, 80, 100], k: [40, 100, 120], ph: [6.0, 7.0] },
        sugarcane: { name: "Sugarcane", n: [100, 250, 300], p: [40, 100, 150], k: [80, 200, 250], ph: [6.5, 7.5] },
        cotton: { name: "Cotton", n: [60, 120, 180], p: [30, 80, 100], k: [40, 100, 150], ph: [5.8, 6.5] },
        soybean: { name: "Soybean", n: [20, 60, 80], p: [40, 80, 100], k: [50, 120, 150], ph: [6.0, 7.0] },
        potato: { name: "Potato", n: [80, 150, 200], p: [50, 120, 180], k: [120, 250, 300], ph: [5.0, 6.5] }
    };

    const target = CROP_DATA[crop] || CROP_DATA.generic;
    recommendations.push(`CROP PROFILE LOADED: ${target.name.toUpperCase()}`);

    // Core Agriculture & Toxicity Logic (Dynamic)
    if (N > target.n[2]) recommendations.push(`Excessive Nitrogen [N]: Levels exceed safe limits for ${target.name}. High risk of root burn and plant damage.`);
    else if (N < target.n[0]) recommendations.push(`Nitrogen Low: Apply Nitrogen-rich fertilizer (like Urea). ${target.name} needs more N for healthy leaves.`);

    if (P > target.p[2]) recommendations.push(`Excessive Phosphorus [P]: Severe excess detected. This will prevent ${target.name} from absorbing Iron and Zinc.`);
    else if (P < target.p[0]) recommendations.push(`Phosphorus Low: Apply DAP or Bone Meal. This is critical for ${target.name} root and flower growth.`);

    if (K > target.k[2]) recommendations.push(`Excessive Potassium [K]: Overload detected. This may interfere with Magnesium and Calcium uptake.`);
    else if (K < target.k[0]) recommendations.push(`Potassium Deficit: Add Potash. This helps ${target.name} resist disease and stay hydrated.`);

    if (PH < target.ph[0]) {
        recommendations.push(`Acidic Soil: pH (${PH}) is too low for ${target.name}. Apply Agricultural Lime to raise pH to ${target.ph[0]}-${target.ph[1]}.`);
    } else if (PH > target.ph[1]) {
        recommendations.push(`Alkaline Soil: pH (${PH}) is too high for ${target.name}. Apply Elemental Sulfur to lower pH to ${target.ph[0]}-${target.ph[1]}.`);
    }

    if (recommendations.length === 1) {
        recommendations.push(`Status: OPTIMAL. All soil parameters are perfect for growing ${target.name}.`);
    }

    // Save to MongoDB if email is provided (logged in)
    if (email) {
        try {
            const analysis = new SoilAnalysis({
                email, crop, n: N, p: P, k: K, ph: PH, recommendations
            });
            await analysis.save();
        } catch (err) {
            console.error("ANALYSIS_SAVE_ERROR:", err);
        }
    }

    res.json({ results: recommendations });
});

// TerraBot Chat Endpoint (Powered by OpenRouter / Llama 3)
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.json({ reply: "Awaiting query." });

    try {
        const prompt = `You are TerraBot, a friendly and helpful AI assistant. Answer the user's questions clearly and concisely.\n\nUser Query: "${message}"`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3.1-8b-instruct",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.5,
                max_tokens: 500
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`OpenRouter API Error: ${data.error?.message || response.statusText}`);
        }

        const text = data.choices && data.choices[0]?.message?.content ? data.choices[0].message.content.trim() : "";
        res.json({ reply: text });
    } catch (err) {
        console.error("TerraBot AI Error:", err.message || err);

        // Graceful Fallback Engine (Rule-based) if Gemini APIKey fails or is invalid
        const msg = message.toLowerCase();
        let fallbackReply = "I am your Agricultural Bot. I can answer questions about soil quality, nutrients, and yield optimization. How can I assist you?";

        if ((msg.includes('how') || msg.includes('test') || msg.includes('measure') || msg.includes('get') || msg.includes('find') || msg.includes('check')) &&
            (msg.includes('nitrogen') || msg.includes('phosphorus') || msg.includes('potassium') || msg.includes('ph') || msg.includes('value') || msg.includes('soil'))) {
            fallbackReply = "To get precise values for soil nutrients (N-P-K) or pH, you should use a home soil testing kit or an electronic soil probe. For the most accurate commercial results, collect core samples and send them to a local agricultural extension or professional soil testing lab.";
        } else if (msg.includes('nitrogen') || msg.includes(' n ')) {
            fallbackReply = "Nitrogen is responsible for the vegetative growth of plants and gives them their green color. Too little causes yellowing, too much causes root burn.";
        } else if (msg.includes('phosphorus') || msg.includes(' p ')) {
            fallbackReply = "Phosphorus helps with energy transfer, root development, and blooming/fruiting. A deficit results in stunted growth and dark/purplish leaves.";
        } else if (msg.includes('potassium') || msg.includes(' k ')) {
            fallbackReply = "Potassium strengthens the plant, improving disease resistance and overall hardiness. It's crucial for water regulation in the plant.";
        } else if (msg.includes('crop') || msg.includes('harvest')) {
            fallbackReply = "The major crops grown in India include Rice, Wheat, Millets, Cotton, Pearl Millet (Bajra), Pulses (Dal), Sugarcane, and Tea. Optimal fertilizer requirements vary heavily depending on whether the crop is grown in the Kharif (monsoon) or Rabi (winter) season.";
        } else if (msg.includes('ph')) {
            fallbackReply = "Soil pH determines how easily plants can absorb nutrients. Most crops prefer a neutral pH between 6.0 and 7.5. Acidic or alkaline soil can cause nutrient lock-out.";
        } else if (msg.includes('yield')) {
            fallbackReply = "Yield optimization relies on balancing N-P-K according to your crop's specific needs while maintaining a neutral pH. Use our scanner to see your theoretical yield curve!";
        } else if (msg.includes('fertilizer')) {
            fallbackReply = "Fertilizers replenish depleted soil nutrients. Always ensure you only apply what your soil lacks to avoid toxic run-offs and root burn.";
        } else if (msg.includes('water') || msg.includes('irrigation')) {
            fallbackReply = "Proper irrigation is just as important as fertilizing. Nutrients must be dissolved in water for roots to absorb them. Avoid waterlogging which chokes roots of oxygen.";
        } else {
            fallbackReply = "I'm an agricultural AI assistant, and my knowledge primarily revolves around soil quality, crops, fertilizers, botany, and agriculture. I'd be happy to help with any questions related to those topics.";
        }

        res.json({ reply: fallbackReply });
    }
});

// Get User Scan History
app.get('/api/history', async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Email required" });
    try {
        const history = await SoilAnalysis.find({ email }).sort({ date: -1 }).limit(10);
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch history" });
    }
});

// Update Scan Rating
app.patch('/api/scans/:id/rate', async (req, res) => {
    try {
        const { rating, feedback } = req.body;
        const scan = await SoilAnalysis.findByIdAndUpdate(
            req.params.id,
            { rating, feedback },
            { returnDocument: 'after' }
        );
        if (!scan) return res.status(404).json({ error: "Scan not found" });
        res.json(scan);
    } catch (err) {
        res.status(500).json({ error: "Rating update failed" });
    }
});

// =============================================
// EXPERT ↔ FARMER CONNECTIVITY ENDPOINTS
// =============================================

// GET all soil analyses (Expert Report Queue)
app.get('/api/expert/reports', async (req, res) => {
    try {
        const reports = await SoilAnalysis.find({}).sort({ date: -1 }).limit(500);
        const advisedReportIds = await Advisory.distinct('reportId');
        const reportsWithStatus = reports.map(r => {
            const doc = r.toObject();
            doc.hasAdvisory = advisedReportIds.some(id => id && id.toString() === r._id.toString());
            return doc;
        });
        res.json(reportsWithStatus);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch reports" });
    }
});


// GET all farmer accounts (non-expert users)
app.get('/api/expert/farmers', async (req, res) => {
    try {
        const farmers = await User.find({ role: 'farmer' }, { email: 1, _id: 0 });
        res.json(farmers);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch farmers" });
    }
});

// GET expert dashboard stats (KPIs)
app.get('/api/expert/stats', async (req, res) => {
    try {
        const totalReports = await SoilAnalysis.countDocuments({});
        const totalFarmers = await User.countDocuments({ role: 'farmer' });
        const totalAdvisories = await Advisory.countDocuments({});
        const unreadAdvisories = await Advisory.countDocuments({ status: 'unread' });

        // Count reports that have no advisory yet (pending)
        const advisedReportIds = await Advisory.distinct('reportId');
        const pendingReports = await SoilAnalysis.countDocuments({ _id: { $nin: advisedReportIds } });

        // Calculate coverage percentage
        const reportsWithAdvice = await Advisory.distinct('reportId');
        const coverageRate = totalReports > 0 ? Math.round((reportsWithAdvice.length / totalReports) * 100) : 0;

        res.json({
            totalReports,
            totalFarmers,
            totalAdvisories,
            unreadAdvisories,
            pendingReports,
            coverageRate
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

// GET all advisories
app.get('/api/expert/advisories', async (req, res) => {
    try {
        const advisories = await Advisory.find().sort({ date: -1 });
        res.json(advisories);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch advisories" });
    }
});


// POST advisory (Expert sends advice to farmer)
app.post('/api/expert/advisory', async (req, res) => {
    try {
        const { farmerEmail, expertEmail, reportId, message } = req.body;
        if (!farmerEmail || !message) {
            return res.status(400).json({ error: "Farmer email and message are required." });
        }
        const advisory = new Advisory({ farmerEmail, expertEmail, reportId, message });
        await advisory.save();
        res.json({ success: true, advisory });
    } catch (err) {
        res.status(500).json({ error: "Failed to send advisory" });
    }
});

// POST broadcast (Expert sends alert to ALL farmers)
app.post('/api/expert/broadcast', async (req, res) => {
    try {
        const { expertEmail, message } = req.body;
        if (!message) return res.status(400).json({ error: "Message is required." });

        const farmers = await User.find({ role: 'farmer' });

        const advisories = farmers.map(f => ({
            farmerEmail: f.email,
            expertEmail: expertEmail,
            message: `📢 BROADCAST ALERT: ${message}`,
            status: 'unread',
            isBroadcast: true
        }));

        await Advisory.insertMany(advisories);
        res.json({ success: true, count: farmers.length });
    } catch (err) {
        console.error("BROADCAST_ERROR:", err);
        res.status(500).json({ error: "Failed to send broadcast alert" });
    }
});

// GET advisories for a specific farmer
app.get('/api/farmer/advisories', async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Email required" });
    try {
        const advisories = await Advisory.find({ farmerEmail: email }).sort({ date: -1 }).limit(20);
        res.json(advisories);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch advisories" });
    }
});

// PATCH mark advisory as read
app.patch('/api/farmer/advisories/:id/read', async (req, res) => {
    try {
        const advisory = await Advisory.findByIdAndUpdate(
            req.params.id,
            { status: 'read' },
            { returnDocument: 'after' }
        );
        if (!advisory) return res.status(404).json({ error: "Advisory not found" });
        res.json(advisory);
    } catch (err) {
        res.status(500).json({ error: "Failed to update advisory" });
    }
});

// =============================================
// ADMIN DASHBOARD ENDPOINTS (Secure)
// =============================================

// GET Admin Statistics
app.get('/api/admin/stats', isAdmin, async (req, res) => {
    try {
        const totalFarmers = await User.countDocuments({ role: 'farmer' });
        const totalExperts = await User.countDocuments({ role: 'expert' });
        const totalReports = await SoilAnalysis.countDocuments({});
        const totalAdvisories = await Advisory.countDocuments({});
        
        // Get counts for health status
        const reports = await SoilAnalysis.find({}, 'n p ph');
        const statusCounts = { critical: 0, warning: 0, optimal: 0 };
        reports.forEach(r => {
            const status = r.healthStatus;
            statusCounts[status]++;
        });

        res.json({
            totalFarmers,
            totalExperts,
            totalReports,
            totalAdvisories,
            statusCounts,
            activeUsers: await User.countDocuments({ status: 'active' })
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch admin stats" });
    }
});

// GET All Users (Filtered & Paginated)
app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
        const { role, status, search } = req.query;
        let query = {};
        if (role && role !== 'all') query.role = role;
        if (status && status !== 'all') query.status = status;
        if (search) query.email = new RegExp(search, 'i');

        const users = await User.find(query).sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// PATCH Update User Role or Status
app.patch('/api/admin/users/:id', isAdmin, async (req, res) => {
    try {
        const { role, status } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        const oldData = { role: user.role, status: user.status };
        if (role) user.role = role;
        if (status) user.status = status;
        await user.save();

        // Audit Log
        await new AuditLog({
            adminEmail: req.user.email,
            action: 'UPDATE_USER',
            targetId: user.email,
            details: `Changed from ${JSON.stringify(oldData)} to ${JSON.stringify({role, status})}`
        }).save();

        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: "Update failed" });
    }
});

// DELETE User
app.delete('/api/admin/users/:id', isAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        await new AuditLog({
            adminEmail: req.user.email,
            action: 'DELETE_USER',
            targetId: user.email,
            details: `Permanently deleted user account.`
        }).save();

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Deletion failed" });
    }
});

// GET All Reports (With Health Status)
app.get('/api/admin/reports', isAdmin, async (req, res) => {
    try {
        const reports = await SoilAnalysis.find().sort({ date: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch reports" });
    }
});

// GET All Advisories
app.get('/api/admin/advisories', isAdmin, async (req, res) => {
    try {
        const advisories = await Advisory.find().sort({ date: -1 });
        res.json(advisories);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch advisories" });
    }
});

// GET Audit Logs
app.get('/api/admin/logs', isAdmin, async (req, res) => {
    try {
        const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch logs" });
    }
});

// POST Admin Broadcast (Targeted)
app.post('/api/admin/broadcast', isAdmin, async (req, res) => {
    try {
        const { message, target } = req.body; // target: 'all', 'farmers', 'experts'
        if (!message) return res.status(400).json({ error: "Message required" });

        let userQuery = {};
        if (target === 'farmers') userQuery.role = 'farmer';
        else if (target === 'experts') userQuery.role = 'expert';

        const users = await User.find(userQuery);
        const advisories = users.map(u => ({
            farmerEmail: u.email,
            expertEmail: 'admin@soil.com',
            message: `🚨 ADMIN NOTICE: ${message}`,
            isBroadcast: true
        }));

        await Advisory.insertMany(advisories);

        await new AuditLog({
            adminEmail: req.user.email,
            action: 'BROADCAST',
            targetId: target,
            details: message
        }).save();

        res.json({ success: true, count: users.length });
    } catch (err) {
        res.status(500).json({ error: "Broadcast failed" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n================================================`);
    console.log(` SYSTEM ONLINE: http://localhost:${PORT}`);
    console.log(` LOGIN PAGE:    http://localhost:${PORT}/login.html`);
    console.log(` DATABASE:       Connected to MongoDB Compass`);
    console.log(`================================================\n`);
});