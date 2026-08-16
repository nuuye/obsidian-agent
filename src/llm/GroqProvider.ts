import Groq from "groq-sdk";
import { LLMProvider, GenerateOptions } from "./types/LLMProvider.js";

export class GroqProvider implements LLMProvider {
    private groq: Groq;

    constructor(private modelName: string) {
        // The SDK is retrieving by itself process.env.GROQ_API_KEY
        this.groq = new Groq();
    }

    async generate(prompt: string, options?: GenerateOptions): Promise<string> {
        let finalPrompt = prompt;

        // Disable thinking
        if (options?.skipThinking) {
            finalPrompt += `\n\nINSTRUCTION CRITIQUE : Ne génère AUCUNE chaîne de pensée. Donne UNIQUEMENT la réponse finale demandée.`;
        }

        try {
            // Streaming handler (for editing)
            if (options?.onToken) {
                const stream = await this.groq.chat.completions.create({
                    messages: [{ role: "user", content: finalPrompt }],
                    model: this.modelName,
                    stream: true, // Activatning continous flow
                });

                let fullText = "";
                for await (const chunk of stream) {
                    const text = chunk.choices[0]?.delta?.content || "";
                    fullText += text;
                    options.onToken(text);
                }
                return fullText;
            }

            // Classic handler (For analazing and comparing the old/new note)
            const response = await this.groq.chat.completions.create({
                messages: [{ role: "user", content: finalPrompt }],
                model: this.modelName,
                stream: false,
            });

            return response.choices[0]?.message?.content || "";
        } catch (error) {
            console.error("[ERROR] Error while reaching Groq API:", error);
            throw new Error("Unable to communicate with Groq.");
        }
    }
}
