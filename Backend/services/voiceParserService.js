// Correct import for the current official Google GenAI SDK (Dec 2025)
const { GoogleGenAI } = require("@google/genai");
//VERSION OF NODE HAS UPDATED;
// let genai;
// async function getGenAI() {
//     if (!genai) {
//         //i have to import -->>require is not needed
//         const { } = await import("@google/genai");
//         genai = new GoogleGenAI({
//             apiKey: process.env.GEMINI_API_KEY
//         });
//     }
//     return genai;
// }
// // Initialize with your API key from .env
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
- tomorrow → tomorrow's date in YYYY-MM-DD ${getTomorrow()}
- in 3 days → add 3 days from today
- next Monday → next Monday's date
- no date mentioned → null

User input: "${transcript}"
`;

        // Use Gemini 2.5 Flash — fast, cheap, and working perfectly
        const response = await genai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        // const response = await gen

        const content = response.text.trim();

        // Clean any markdown code blocks the AI might add
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