const { parseVoiceInputIntoText } = require("../services/voiceParserService");

// Export Parse Voice Transcript
exports.parseVoiceTranscript = async (req, res) => {
    try {
        // STEP 1: Get transcript from request body 
        const { transcript } = req.body;

        // Checking transcript exists or not 
        if (!transcript) {
            return res.status(400).json({
                success: false,
                error: 'Transcript is required'
            });
        }

        // Check if it's empty
        if (transcript.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Transcript cannot be empty'
            });
        }

        // Basic protection against too-short inputs (prevents spam API calls)
        if (transcript.trim().length < 5) {
            return res.status(400).json({
                success: false,
                error: 'Transcript too short. Please speak a complete task.'
            });
        }

        // STEP 2: Call AI service to parse transcript
        const parsedResponse = await parseVoiceInputIntoText(transcript);

        // Success response
        return res.status(200).json({
            success: true,
            data: {
                transcript: transcript,           // Original spoken text
                parsedResponse: parsedResponse    // Extracted fields (title, priority, dueDate, status)
            }
        });

    } catch (error) {
        console.error('Parse voice error:', error);

        // Specific error handling for Gemini (more accurate than old OpenAI checks)

        if (error.message.includes('API key') || error.message.includes('invalid') || error.message.includes('unauthorized')) {
            return res.status(500).json({
                success: false,
                error: 'Gemini API key invalid or missing. Check GEMINI_API_KEY in .env file.'
            });
        }

        if (error.message.includes('rate') || error.message.includes('quota') || error.message.includes('429')) {
            return res.status(429).json({
                success: false,
                error: 'Too many requests. Please wait a moment and try again.'
            });
        }

        if (error.message.includes('JSON') || error.message.includes('Unexpected token')) {
            return res.status(500).json({
                success: false,
                error: 'Failed to parse AI response format. Please try again.'
            });
        }

        // Generic fallback error
        return res.status(500).json({
            success: false,
            error: 'Failed to parse voice input. Please try again.'
        });
    }
};