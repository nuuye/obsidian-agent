import { LLMProvider } from "../llm/LLMProvider.js";
import { Analysis } from "../core/types/Analysis.js";

export class NoteEditor {
    constructor(private llm: LLMProvider) {}

    async edit(originalContent: string, analysis: Analysis): Promise<string> {
        const prompt = `
        Tu dois proposer une version améliorée de cette note Obsidian.

        Règles à respecter STRICTEMENT :
        1. Corriger les fautes et le formatage Markdown.
        2. Préserver le style de l'auteur (Ton: ${analysis.writingStyle.tone}).
        3. Ne supprimer aucune information existante.
        4. N'inventer aucun lien vers des notes inexistantes.
        5. ${
            analysis.schema.useful && analysis.schema.score > 0.7
                ? `Ajouter un schéma Mermaid de type ${analysis.schema.type} car: ${analysis.schema.reason}`
                : "Ne PAS ajouter de schéma."
        }
        
        Retourne UNIQUEMENT le code Markdown de la note modifiée. Ne fais pas d'introduction ou de conclusion.

        Contenu original :
        """
        ${originalContent}
        """
        `;

        const modifiedContent = await this.llm.generate(prompt);
        // Nettoyage des éventuelles balises Markdown encapsulant la réponse
        return modifiedContent.replace(/^```markdown\n?|\n?```$/g, "").trim();
    }
}
