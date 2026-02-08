const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/DatabaseConnection");
//install cors
const cors = require("cors");
//  2. LOAD ENVIRONMENT VARIABLES
dotenv.config();
//create express app
const app = express();
// 4. MIDDLEWARE (Functions that process requests)

// Enable CORS - ADD THIS BEFORE OTHER MIDDLEWARE to work frontend and backend toghether

app.use(cors({
//Allow React-front-end 
origin: 'http://localhost:3000', //Allow React-App
credentials: true,
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
//  USE ROUTES :->
app.use('/api/tasks',taskRoutes);
//voice-route
app.use('/api/voice',voiceRoutes);
app.get("/api/check", (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server is running!'
    })
})
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
