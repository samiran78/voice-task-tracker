const { parseVoiceInputIntoText } = require("../services/voiceParserService");


//export Parse Voice Transcript
exports.parseVoiceTranscript = async (req, res) => {
    try {
        // STEP 1: Get transcript from request body 
        const { transcript } = req.body;
        //checking transcript exists or not 
        if (!transcript) {
            return res.status(400).json({
                success: false,
                error: 'Transcript is required'
            })
        }
        //now also check if its empty or not..
        if (transcript.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Transcript cannot be empty'
            });
        }
        //checking -> to prevent limitless api-calls,atleast basic protection 
        if(transcript.trim().length<5){
            return res.status(400).json({
               success: false,
               error: 'Transcript too short. Please speak a complete task.'
            });
        }
        //  STEP 2: Call AI service function () to parse transcript
        const parsedResponse = await parseVoiceInputIntoText(transcript);
        //return success message 
        return res.status(200).json({
            success:true,
            data:{
                transcript: transcript, //original text
                parsedResponse: parsedResponse  // Extracted fields
            }
        })
    } catch (error) {
          console.error('Parse voice error:', error);
          //error can come here from several diffirent points
          ///speicific error 
          if(error.message.include('API key')){
            
          }
    }
}