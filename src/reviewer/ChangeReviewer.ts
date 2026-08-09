import { LLMProvider } from "../llm/LLMProvider";

// Interface interne pour le format de retour attendu du LLM
interface ChangesJSON {
    changes: Array<{
        id: string;
        type: "formatting" | "content" | "schema" | "link" | "new_note";
        description: string;
    }>;
}

export class ChangeReviewer {
    constructor(private llm: LLMProvider) {}

    async review(original: string, modified: string): Promise<ChangesJSON> {
        const prompt = `
        Compare la "Note Originale" et la "Note Modifiée".
        Identifie les changements significatifs et retourne-les au format JSON.
        
        Format JSON attendu :
        {
            "changes": [
            {
                "id": "change-1",
                "type": "formatting", // ou content, schema, link, new_note
                "description": "Description courte du changement"
            }
            ]
        }

        Note Originale :
        """
        ${original}
        """

        Note Modifiée :
        """
        ${modified}
        """
        `;

        const response = await this.llm.generate(prompt);

        try {
            const cleanJson = response.replace(/```json\n?|\n?```/g, "").trim();
            return JSON.parse(cleanJson) as ChangesJSON;
        } catch (e) {
            throw new Error("Échec du parsing JSON lors de la revue des changements.");
        }
    }
}
