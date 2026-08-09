import { LLMProvider } from "../llm/LLMProvider";
import { Analysis } from "../core/types/Analysis";

export class NoteAnalyzer {
    constructor(private llm: LLMProvider) {}

    async analyze(content: string): Promise<Analysis> {
        const prompt = `
        Tu es un expert en gestion des connaissances (PKM) et Obsidian.
        Analyse la note Markdown suivante et retourne UNIQUEMENT un objet JSON valide 
        correspondant à cette structure :
        {
            "summary": "résumé string",
            "topics": ["sujet1", "sujet2"],
            "writingStyle": { "language": "fr|en", "tone": "...", "structure": "..." },
            "schema": { "useful": boolean, "score": number 0-1, "type": "...", "reason": "..." },
            "missingInformation": [{ "topic": "...", "reason": "..." }]
        }

        Contenu de la note :
        """
        ${content}
        """
        `;

        const response = await this.llm.generate(prompt);

        // Simplification pour l'exemple : on suppose que le LLM retourne un JSON valide.
        // Dans une version de production, il faudra parser et valider (ex: avec Zod).
        try {
            // Nettoyage basique si le LLM renvoie des balises Markdown ```json ... ```
            const cleanJson = response.replace(/```json\n?|\n?```/g, "").trim();
            return JSON.parse(cleanJson) as Analysis;
        } catch (e) {
            throw new Error("Échec du parsing JSON lors de l'analyse de la note.");
        }
    }
}
