// // Import OpenAI library
// // const OpenAI = require("openai");  //CAN'T USE , DUE TO BILLING 
// // Import Google Generative AI library
// // const { GoogleGenerativeAI } = require("@google/generative-ai");
// const { GoogleGenAI} = require("@google/genai");
// // Create OpenAI client (connects to OpenAI API)
// // const openai = new OpenAI({
// //     apiKey : process.env.OPENAI_API_KEY   // reads from .env file.  -->//CAN'T USE , DUE TO BILLING 
// // })
// // Initialize Gemini
// // const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// // const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);
// const genAI = new GoogleGenAI();
// //function :-> got the voice input in TEXT Form and extract 
// const parseVoiceInputIntoText = async (transcript) => {
//     try {
//         // Get today's date for relative date parsing
//         const today = new Date().toISOString().split('T')[0];
//         //Build the prompt :-> Instruction for AI ::-> This is where you teach the AI what to do
//         const prompt = ` you are a task parser. Extract task information from natural language.
// Today's date: ${today}
// Extract these fields:
// - title: The main task description
// - dueDate: Date in YYYY-MM-DD format or null
// - priority: "low", "medium", or "high"
// - status: Always "todo"

// Priority rules:
// - "urgent", "critical", "asap", "high priority" → "high"
// - "low priority", "not urgent" → "low"
// - Otherwise → "medium"

// Date parsing rules:
// - "tomorrow" → ${getTomorrow()}
// - "today" → ${today}
// - "next Monday" → calculate next Monday's date
// - "in 3 days" → add 3 days
// - No date mentioned → null

// User input: "${transcript}"

// Respond ONLY with valid JSON (no markdown, no extra text):
// {
//   "title": "task description here",
// "priority": "low|medium|high",
//   "dueDate": "YYYY-MM-DD or null",
//   "priority": "low/medium/high",
//   "status": "TODO"
// }
// `
//         //  // Call OpenAI API Model :-> Builds prompt with instructions && Sends to OpenAI API ---> ❌ bill issue
//         //  const response = await openai.chat.completions.create({
//         //     //"gpt-4o-mini", -> // Cheaper, faster model for simple tasks
//         //     model :  "gpt-3.5-turbo",
//         //      // SYSTEM: Sets the stage, // USER: Your actual request
//         //           messages: [
//         //                 {
//         //                     role: "system",  // ← Sets AI's behavior
//         //                     content: "You are a task parser. Respond only with valid JSON."
//         //                 },
//         //                 {
//         //                     role: "user",  // ← Your actual request
//         //                     content: prompt
//         //                 }
//         //             ],
//         //      // Lower = more consistent/predictable :-
//         //     temperature : 0.2,
//         //     max_tokens: 200
//         //  });

//         // Call Gemini API Model
//         // const model = genAI.getGenerativeModel({
//         //      model: "gemini-2.5-flash" 
//         // })
//         //calling genAi->
//         const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });  // Latest fast model (Dec 2025)

//         const result = await model.generateContent(prompt);
//         const response = await result.response;
//         //get the AI'S response 
//         const content = response.text().trim();
//         // const content = response.choices[0].message.content.trim();
//         //cleanup response ->
//         const cleanedContent = content
//             .replace(/```json\n?/g, '')
//             .replace(/```\n?/g, '')
//             .trim();
//         //now convert into json-->calling jsonparsing!
//         const parseResponse = JSON.parse(cleanedContent);
//         //now return it by sanitizing cleaner way to avoide ,foggy errors/chaos/null-poinmter exception :-
//         return {
//             title: parseResponse.title || null,
//             priority: ['low', 'medium', 'high'].includes(parseResponse.priority) ? parseResponse.priority : 'medium', //by-default we set medium 
//             dueDate: parseResponse.dueDate || null,
//             status: 'todo' //by-default always 
//         }
//     } catch (error) {
//         console.log(error);
//         //speicific error message ;->
//          if (error.message.includes('API_KEY_INVALID')) {
//             throw new Error('Invalid API key. Check your .env file');
//         } else if (error.message.includes('404')) {
//             throw new Error('Model not found. Make sure Generative Language API is enabled');
//         } else if (error.message.includes('PERMISSION_DENIED')) {
//             throw new Error('API key does not have permission. Enable Generative Language API');
//         }else{
//        throw new Error(`☹️ Failed to parse ${error.message}`);
//         }

//     }
// }
// const getTomorrow = () => {
//     const tomorrow = new Date();  // ← Your error: Date.now() returns number!
//     tomorrow.setDate(tomorrow.getDate() + 1);
//     return tomorrow.toISOString().split('T')[0];
// };
// // // Helper to list available models (for debugging)
// // async function listAllModels() {
// //   const response = await genAI.models.list();

// //   console.log("Available models are:->");

// //   response.models.forEach(model => {
// //     console.log(model.name);
// //   });
// // }

// // listAllModels();

// //export this file
// module.exports = {
//     parseVoiceInputIntoText
// };
// NEW CORRECT IMPORT FOR CURRENT SDK (Dec 2025)
// Correct import for the current official Google GenAI SDK (Dec 2025)
const { GoogleGenAI } = require("@google/genai");

// Initialize with your API key (reads GEMINI_API_KEY from .env)
const genai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const parseVoiceInputIntoText = async (transcript) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const prompt = `You are a task parser. Extract task information from natural language.
Today's date: ${today}

Respond ONLY with valid JSON (no markdown, no extra text). Extract exactly these fields:

{
  "title": "the main task description",
  "priority": "low", "medium", or "high",
  "dueDate": "YYYY-MM-DD" or null if no date mentioned,
  "status": "todo"
}

Priority rules:
- urgent, critical, asap, high priority → "high"
- low priority, not urgent → "low"
- otherwise → "medium"

Date rules:
- tomorrow → ${getTomorrow()}
- in 3 days → add 3 days
- next Monday → next Monday
- no date → null

User input: "${transcript}"
`;

        // Current fast & cheap model (Dec 2025)
        const response = await genai.models.generateContent({
            model: "gemini-2.5-flash",  // This is the stable fast model right now
            contents: prompt,
        });

        const content = response.text.trim();

        // Clean any code fences
        const cleanedContent = content
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const parsed = JSON.parse(cleanedContent);

        return {
            title: parsed.title || "Untitled task",
            priority: ['low', 'medium', 'high'].includes(parsed.priority?.toLowerCase())
                ? parsed.priority.toLowerCase()
                : 'medium',
            dueDate: parsed.dueDate || null,
            status: 'todo'
        };

    } catch (error) {
        console.error("Gemini parsing error:", error);
        throw new Error("Failed to parse task with Gemini");
    }
};

const getTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
};

module.exports = { parseVoiceInputIntoText };