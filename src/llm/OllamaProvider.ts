import { LLMProvider, GenerateOptions } from "./LLMProvider.js";

export class OllamaProvider implements LLMProvider {
    private baseUrl: string;
    private model: string;

    constructor(model: string = "qwen3:14b", baseUrl: string = "http://127.0.0.1:11434") {
        this.model = model;
        this.baseUrl = baseUrl;
    }

    async generate(prompt: string, options?: GenerateOptions): Promise<string> {
        let finalPrompt = prompt;

        // Si on veut désactiver la réflexion, on injecte une instruction critique
        if (options?.skipThinking) {
            finalPrompt += `\n\nINSTRUCTION CRITIQUE : Ne génère AUCUNE chaîne de pensée, aucune explication et n'utilise pas de balise <think>. Donne UNIQUEMENT la réponse finale demandée.`;
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: this.model,
                    prompt: finalPrompt,
                    stream: false,
                }),
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();
            let responseText = data.response;

            // Nettoyage de sécurité : si le modèle a quand même "pensé", on retire les balises
            if (options?.skipThinking) {
                responseText = responseText.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
            }

            return responseText;
        } catch (error) {
            console.error("❌ Erreur de connexion à Ollama :", error);
            throw new Error("Impossible de communiquer avec le LLM local.");
        }
    }
}
