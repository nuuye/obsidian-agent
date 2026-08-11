import Groq from "groq-sdk";
import { LLMProvider, GenerateOptions } from "./LLMProvider.js";

export class GroqProvider implements LLMProvider {
    private groq: Groq;

    constructor(private modelName: string) {
        // Le SDK récupère automatiquement process.env.GROQ_API_KEY
        this.groq = new Groq();
    }

    async generate(prompt: string, options?: GenerateOptions): Promise<string> {
        let finalPrompt = prompt;

        if (options?.skipThinking) {
            finalPrompt += `\n\nINSTRUCTION CRITIQUE : Ne génère AUCUNE chaîne de pensée. Donne UNIQUEMENT la réponse finale demandée.`;
        }

        try {
            // GESTION DU STREAMING (Pour l'éditeur de notes)
            if (options?.onToken) {
                const stream = await this.groq.chat.completions.create({
                    messages: [{ role: "user", content: finalPrompt }],
                    model: this.modelName,
                    stream: true, // Activation du flux continu
                });

                let fullText = "";
                for await (const chunk of stream) {
                    const text = chunk.choices[0]?.delta?.content || "";
                    fullText += text;
                    options.onToken(text);
                }
                return fullText;
            }

            // GESTION CLASSIQUE (Pour l'analyse et la comparaison)
            const response = await this.groq.chat.completions.create({
                messages: [{ role: "user", content: finalPrompt }],
                model: this.modelName,
                stream: false,
            });

            return response.choices[0]?.message?.content || "";
        } catch (error) {
            console.error("[ERROR] Erreur de connexion à l'API Groq :", error);
            throw new Error("Impossible de communiquer avec Groq.");
        }
    }
}
