const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
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
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("DATABASE_CONNECTED: MongoDB Compass ready."))
    .catch(err => console.error("DATABASE_CONNECTION_ERROR:", err));

// User Schema
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
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
const SoilAnalysis = mongoose.model('SoilAnalysis', soilAnalysisSchema);

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
    res.send(`
        <script>
            localStorage.setItem('loggedIn', 'true');
            localStorage.setItem('userEmail', '${email}');
            window.location.href = 'index.html';
        </script>
    `);
});

app.use(express.json());
app.use(express.static('public'));

// --- AUTHENTICATION ENDPOINTS ---

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "User already exists." });

        const newUser = new User({ email, password });
        await newUser.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Signup failed." });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });
        if (!user) return res.status(401).json({ error: "Invalid email or password." });

        res.json({ success: true, email: user.email });
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n================================================`);
    console.log(`🚀 SYSTEM ONLINE: http://localhost:${PORT}`);
    console.log(`🔑 LOGIN PAGE:    http://localhost:${PORT}/login.html`);
    console.log(`✅ DATABASE:       Connected to MongoDB Compass`);
    console.log(`================================================\n`);
});