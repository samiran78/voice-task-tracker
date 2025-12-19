// Import OpenAI library
const OpenAI = require("openai");
// Create OpenAI client (connects to OpenAI API)
const openai = new OpenAI({
    apiKey : process.env.OPENAI_API_KEY   // reads from .env file.
})
//function :-> got the voice input in TEXT Form and extract 
const parseVoiceInputIntoText = async(transcript) =>{
    try {
        // Get today's date for relative date parsing
    const today = new Date().toISOString().split('T')[0];
    //Build the prompt :-> Instruction for AI ::-> This is where you teach the AI what to do
const prompt = ` you are a task parser. Extract task information from natural language.
Today's date: ${today}
Extract these fields:
- title: The main task description
- dueDate: Date in YYYY-MM-DD format or null
- priority: "low", "medium", or "high"
- status: Always "todo"

Priority rules:
- "urgent", "critical", "asap", "high priority" → "high"
- "low priority", "not urgent" → "low"
- Otherwise → "medium"

Date parsing rules:
- "tomorrow" → ${getTomorrow()}
- "today" → ${today}
- "next Monday" → calculate next Monday's date
- "in 3 days" → add 3 days
- No date mentioned → null

User input: "${transcript}"

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "title": "task description here",
"priority": "low|medium|high",
  "dueDate": "YYYY-MM-DD or null",
  "priority": "low/medium/high",
  "status": "TODO"
}
`
 // Call OpenAI API Model :-> Builds prompt with instructions && Sends to OpenAI API
 const response = await openai.chat.completions.create({
    //"gpt-4o-mini", -> // Cheaper, faster model for simple tasks
    model :  "gpt-3.5-turbo",
     // SYSTEM: Sets the stage, // USER: Your actual request
          messages: [
                {
                    role: "system",  // ← Sets AI's behavior
                    content: "You are a task parser. Respond only with valid JSON."
                },
                {
                    role: "user",  // ← Your actual request
                    content: prompt
                }
            ],
     // Lower = more consistent/predictable :-
    temperature : 0.2,
    max_tokens: 200
 });
 //get the AI'S response 
const content = response.choices[0].message.content.trim(); 
 //cleanup response ->
     const cleanedContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
//now convert into json-->calling jsonparsing!
const parseResponse = JSON.parse(cleanedContent);
//now return it by sanitizing cleaner way to avoide ,foggy errors/chaos/null-poinmter exception :-
return{
    title: parseResponse.title || null,
    priority :  ['low', 'medium', 'high'].includes(parseResponse.priority)?parseResponse.priority : 'medium', //by-default we set medium 
    dueDate: parseResponse.dueDate || null,
    status: 'todo' //by-default always 
}
    } catch (error) {
      console.log(error);
      throw new Error(`☹️ Failed to parse ${error.message}`);
    }
}
const getTomorrow = () => {
    const tomorrow = new Date();  // ← Your error: Date.now() returns number!
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
};

//export this file
module.exports = {
parseVoiceInputIntoText
};