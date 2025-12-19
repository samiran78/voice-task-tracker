// Import OpenAI library
const OpenAI = require("openai");
// Create OpenAI client (connects to OpenAI API)
const openai = new OpenAI({
    apikey : process.env.OPENAI_API_KEY   // reads from .env file.
})
//function :-> got the voice input in TEXT Form and extract 
const parseVoiceInputIntoText = async(t) =>{
    try {
        // Get today's date for relative date parsing
    const today = new Date().toISOString().split('T')[0];
    //Build the prompt :-> Instruction for AI ::-> This is where you teach the AI what to do
const prompt = ` you are a task parser. Extract task information from natural language.
Today's date: ${today}
// Extract these fields :->
// -Title: get the description from the voice input
// -Due Date: bydefualt select as null, if select set as yyyy-mm-hh
// -priority: extract and Identify keywords like "low", "medium", or "high"
// -status : by defualt choose TODO Either choose by user reaction to in-progress,done
// -Due Date: Parse relative dates ("tomorrow", "next Monday", "in 3
// days") and absolute dates ("15th January", "Jan 20") or Null.

// priority rules:
// -- "urgent", "critical", "asap", "high priority" → "high"
// - "low priority", "not urgent" → "low"  
// - Otherwise → "medium"
// Date parsing rules:
// for tomorrow 
Extract these fields:
- title: The main task description
- dueDate: Date in YYYY-MM-DD format or null
- priority: "low", "medium", or "high"
- status: "TODO" (default)

Priority rules:
- "urgent", "critical", "asap", "high priority" → "high"
- "low priority", "not urgent" → "low"
- Otherwise → "medium"

Date parsing rules:
- "tomorrow" → ${getTomorrow()}
- "today" → ${today}
- "next Monday" → calculate next Monday's date
- "in 3 days" → add 3 days to today
- "15th January" → 2025-01-15
- No date mentioned → null

User input: "${t}"

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "title": "task description here",
  "dueDate": "YYYY-MM-DD or null",
  "priority": "low/medium/high",
  "status": "TODO"
}
`

    } catch (error) {
        return res.json({
            error: error
        })
    }
}