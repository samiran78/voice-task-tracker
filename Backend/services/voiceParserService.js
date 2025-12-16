// Import OpenAI library
const OpenAI = require("openai");
// Create OpenAI client (connects to OpenAI API)
const openai = new OpenAI({
    apikey : process.env.OPENAI_API_KEY   // reads from .env file.
})
//function :-> got the voice input in TEXT Form and extract 
const parseVoiceInputIntoText = async(t) =>{
    try {
        
    } catch (error) {
        return res.json({
            error: error
        })
    }
}