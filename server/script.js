import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);

export const generateResponse = async (prompt) => {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    prompt = prompt || 'say "Prompt Error." and nothing else';

    try {
        const result = await model.generateContent(prompt);
        return result.response.text()
    } catch (error) {
        console.log("Error generating content. ", error);
        throw error;
    }
};


// const prompt = "Explain how AI works";


