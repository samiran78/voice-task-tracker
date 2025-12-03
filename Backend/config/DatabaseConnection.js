// Import mongoose (MongoDB helper library)
const mongoose = require('mongoose');

// Function to connect to database
const connectDB = async () => {
  try {
    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URL);
    
    // Success message
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
  } catch (error) {
    // If connection fails
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);  // Exit app if database fails
  }
};

// Export this function so server.js can use it
module.exports = connectDB;