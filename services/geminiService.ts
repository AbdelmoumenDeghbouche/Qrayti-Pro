
import { GoogleGenAI, GenerateContentResponse, Content, Part, GroundingChunk } from "@google/genai";
import { QuizQuestion, Flashcard } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn(
    "API_KEY environment variable not found. The application will not be able to connect to the Gemini API."
  );
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });
const textModel = 'gemini-2.0-flash';

function parseJsonFromText(text: string): any {
  let jsonStr = text.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse JSON response:", e, "Raw text:", text);
    throw new Error("Failed to parse AI response as JSON. The format might be incorrect.");
  }
}

const generateContentWithPrompt = async (
  // The main instruction for the AI, e.g., "Summarize the following content..."
  instructionPrompt: string, 
  // The user's actual content: could be text or image parts
  inputContent: string | Part | Part[], 
  isJsonOutput: boolean = false
): Promise<{ text: string; groundingChunks?: GroundingChunk[] }> => {
  if (!API_KEY) throw new Error("API Key for Gemini not configured.");

  const partsForGemini: Part[] = [];

  if (typeof inputContent === 'string') {
    // For text input, prepend the user's content to the instruction prompt.
    // This forms a single coherent text block for the AI.
    partsForGemini.push({ text: `${inputContent}\n\n${instructionPrompt}` });
  } else if (Array.isArray(inputContent)) {
    // For multiple image parts, the instruction prompt comes first, then the images.
    partsForGemini.push({ text: instructionPrompt });
    partsForGemini.push(...inputContent); 
  } else { 
    // For a single image part, instruction prompt first, then the image.
    partsForGemini.push({ text: instructionPrompt });
    partsForGemini.push(inputContent);
  }
  
  const contents: Content[] = [{ role: "user", parts: partsForGemini }];

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: textModel,
      contents: contents,
      config: {
        ...(isJsonOutput ? { responseMimeType: "application/json" } : {}),
      },
    });
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    return {
      text: response.text,
      groundingChunks: groundingMetadata?.groundingChunks as GroundingChunk[] | undefined,
    };
  } catch (error) {
    console.error("Gemini API call failed:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API error: ${error.message}`);
    }
    throw new Error("An unknown error occurred with the Gemini API.");
  }
};


export const generateSummary = async (content: string | Part | Part[], language: string): Promise<string> => {
  const promptText = `Summarize the following content concisely in ${language}.`;
  const result = await generateContentWithPrompt(promptText, content);
  return result.text.replace(/\*/g, ''); // Remove asterisks
};

export const generateExplanation = async (content: string | Part | Part[], language: string): Promise<string> => {
  const promptText = `Explain the following content in a clear and detailed manner, as if explaining to a student, in ${language}.`;
  const result = await generateContentWithPrompt(promptText, content);
  return result.text.replace(/\*/g, ''); // Remove asterisks
};

export const generateQuiz = async (content: string | Part | Part[], language: string): Promise<QuizQuestion[]> => {
  const promptText = `Based on the following content, generate a quiz in ${language}.
The quiz should consist of 3-5 multiple-choice questions.
For each question, provide (in ${language}):
1.  "question": The question text (string).
2.  "options": An array of 4 unique string options.
3.  "correctAnswer": The string of the correct answer, which must exactly match one of the provided options.

Format the entire output as a single JSON array of objects. The text content of questions, options, and correctAnswer MUST be in ${language}. Example (content in ${language}):
[
  {
    "question": "What is the primary function of the mitochondria?",
    "options": ["Protein synthesis", "Energy production (ATP)", "Waste disposal", "Cellular movement"],
    "correctAnswer": "Energy production (ATP)"
  }
]`;
  const result = await generateContentWithPrompt(promptText, content, true);
  try {
    const parsedQuiz = parseJsonFromText(result.text);
    if (Array.isArray(parsedQuiz)) {
      return parsedQuiz.map((q: any) => ({
        question: q.question || "Missing question",
        options: Array.isArray(q.options) && q.options.length > 0 ? q.options : ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: q.correctAnswer || (q.options && q.options[0]) || "N/A",
      })) as QuizQuestion[];
    }
    console.error("Parsed quiz is not an array:", parsedQuiz);
    throw new Error("Quiz data is not in the expected array format.");
  } catch (error: any) {
     console.error("Error processing quiz data:", error);
     throw error; 
  }
};

export const generateMindMap = async (content: string | Part | Part[], language: string): Promise<string> => {
  const promptText = `Generate a text-based mind map in ${language} for the following content.
Outline key concepts and their relationships hierarchically using ${language} terms. 
Use indentation (e.g., tabs or spaces) or bullet points (e.g., -, *, +) to represent the structure. 
The main topic should be at the top level. Sub-topics and details should be nested underneath. All text in the mind map must be in ${language}.`;
  const result = await generateContentWithPrompt(promptText, content);
  return result.text;
};

export const generateFlashcards = async (content: string | Part | Part[], language: string): Promise<Flashcard[]> => {
  const promptText = `Based on the following content, generate 5-10 flashcards in ${language}.
Each flashcard should have a "front" (a term, concept, or question) and a "back" (its definition, explanation, or answer).
The content for both front and back MUST be in ${language}.
Format the entire output as a single JSON array of objects. Each object in the array should have two string properties: "front" and "back".

Example (content in ${language}):
[
  {
    "front": "What is the capital of France?",
    "back": "Paris"
  },
  {
    "front": "Define 'photosynthesis'.",
    "back": "The process by which green plants and some other organisms use sunlight to synthesize foods with the help of chlorophyll pigment."
  }
]`;
  const result = await generateContentWithPrompt(promptText, content, true);
  try {
    const parsedFlashcards = parseJsonFromText(result.text);
    if (Array.isArray(parsedFlashcards)) {
      return parsedFlashcards.map((fc: any) => ({
        front: fc.front || "Missing front content",
        back: fc.back || "Missing back content",
      })) as Flashcard[];
    }
    console.error("Parsed flashcards is not an array:", parsedFlashcards);
    throw new Error("Flashcard data is not in the expected array format.");
  } catch (error: any) {
    console.error("Error processing flashcard data:", error);
    throw error;
  }
};
