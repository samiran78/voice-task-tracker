const express = require("express");
console.log("🚀 --- DEPLOYMENT VERSION: 2.0 (STABILITY FIX) ---");
const dotenv = require("dotenv");
const connectDB = require("./config/DatabaseConnection");
//install cors
const cors = require("cors");
//install helmet
const helmet = require("helmet");
//install express-rate-limit
const rateLimit = require("express-rate-limit");
const morgan = require("morgan"); //for logging
//  2. LOAD ENVIRONMENT VARIABLES
dotenv.config();
//create express app
const app = express();
//security
app.use(helmet());
app.use(morgan("dev"));
// 4. MIDDLEWARE (Functions that process requests)
//Rate limiter:->
// Rate limiting says: one IP address can only make X requests in Y time window. 
// After that, you return a 429 error and ignore them until the window resets.
// Enable CORS - ADD THIS BEFORE OTHER MIDDLEWARE to work frontend and backend toghether
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, error: 'Too many requests, slow down.' }
});
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15, // brute force protection
    message: { success: false, error: 'Too many auth attempts.' }
});
//aplying limiter
app.use('/api/auth', authLimiter);  // specific first ✅
app.use('/api', limiter);           // general second ✅
app.use(cors({
    origin: '*', // Allow all origins during development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
// ============================================
// 5. TEST ROUTE (Check if server works)
// IMPORT ROUTES:->
const taskRoutes = require("./routes/taskRoutes");
//import voice-route
const voiceRoutes = require("./routes/voiceRoutes");
const authRoutes = require("./routes/authRoutes");
//  USE ROUTES :->
app.use('/api/tasks', taskRoutes);
//voice-route
// Rate limiting says: one IP address can only make X requests in Y time window. 
// After that, you return a 429 error and ignore them until the window resets.
app.use('/api/voice', voiceRoutes);
app.use('/api/auth', authRoutes);
app.get("/api/check", (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server is running!'
    })
})
// Root Route: Welcome Message
app.get("/", (req, res) => {
    res.status(200).send(`
        <div style="font-family: sans-serif; text-align: center; padding-top: 50px;">
            <h1 style="color: #2c3e50;">🚀 Voice Task Tracker API is LIVE!</h1>
            <p style="color: #7f8c8d;">This is the backend server for your AI-powered task manager.</p>
            <div style="margin-top: 20px;">
                <a href="/api/check" style="text-decoration: none; background: #3498db; color: white; padding: 10px 20px; border-radius: 5px;">Check Health Status</a>
            </div>
            <p style="margin-top: 30px; font-size: 0.9em; color: #95a5a6;">Connect your frontend to this URL: <strong>${req.protocol}://${req.get('host')}/api</strong></p>
        </div>
    `);
});
//  6. CONNECT TO DATABASE & START SERVER
const port = process.env.PORT || 5000;
//we should sure that, only start my application-SERVER after database connection starts.
connectDB().then(() => {
    // Only start server AFTER database connects
    app.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`);
        console.log(`📍-> Health check: http://localhost:${port}/api/check`);

    })
})
