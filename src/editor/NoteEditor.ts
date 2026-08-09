import { LLMProvider } from "../llm/LLMProvider.js";
import { Analysis } from "../core/types/Analysis.js";

export class NoteEditor {
    constructor(private llm: LLMProvider) {}

    private cleanLLMOutput(content: string): string {
        let text = content.trim();
        const hasGlobalOpen = /^```(?:markdown)?\r?\n/i.test(text);
        
        if (hasGlobalOpen) {
            text = text.replace(/^```(?:markdown)?\r?\n/i, "").trim();
            const remainingBackticks = (text.match(/```/g) || []).length;
            if (text.endsWith("```") && remainingBackticks % 2 === 0) {
                text = text.substring(0, text.length - 3).trim();
            }
        }
        return text;
    }

    async edit(
        originalContent: string,
        analysis: Analysis,
        existingNotes: string[],
        onToken?: (chunk: string) => void
    ): Promise<string> {
        
        const indexingPrompt = existingNotes && existingNotes.length > 0
            ? `4. LIENS : Voici la liste exacte des autres notes existantes dans le Vault : [${existingNotes.join(", ")}]. Si un concept de cette liste est mentionné, transforme-le en lien Obsidian (ex: [[Concept]]). N'invente AUCUN lien vers des notes qui ne sont pas dans cette liste.`
            : "";

        // Ajout de la consigne stricte sur les listes à puces
        const missingInfoPrompt = analysis.missingInformation && analysis.missingInformation.length > 0
        ? `5. ENRICHISSEMENT : Tu dois expliquer les concepts suivants : ${analysis.missingInformation.map(m => m.topic).join(", ")}. 
            -> Règle d'or 1 : ADAPTE LE FORMAT. Si l'explication est concise, utilise une LISTE À PUCES (3 à 5 points). Si le concept nécessite une explication plus longue ou complexe, utilise des paragraphes structurés avec des sous-titres Markdown (###).
            -> Règle d'or 2 : SUPPRIME ou REFORMULE les phrases de la note originale qui indiquaient un besoin d'apprendre ou de comprendre ces concepts (ex: "Je dois encore comprendre...").`
        : "";

        const prompt = `Tu dois proposer une version améliorée de cette note Obsidian.
        
        Règles à respecter STRICTEMENT :
        1. Corriger les fautes et le formatage Markdown.
        2. Préserver le style de l'auteur (Ton: ${analysis.writingStyle.tone}).
        3. Ne supprimer aucune information existante pertinente. (Tu es autorisé à supprimer les phrases obsolètes selon la règle d'enrichissement si elle s'applique).
        ${indexingPrompt}
        ${missingInfoPrompt}
        6. ${
            analysis.schema.useful && analysis.schema.score > 0.5
                ? `SCHÉMA MERMAID AVANCÉ OBLIGATOIRE :
                    - Ajoute TOUJOURS un schéma Mermaid à la fin de la note.
                    - Utilise la syntaxe "graph TD".
                    - OBLIGATOIRE : Ajoute du texte sur tes flèches pour expliquer clairement la relation entre les nœuds (Syntaxe : A -->|fait quelque chose| B).
                    - Le bloc DOIT impérativement commencer par \`\`\`mermaid et SE TERMINER par \`\`\`.`
                : "Ne PAS ajouter de schéma."
        }
        7. NE PLACE JAMAIS ta réponse finale dans un bloc \`\`\`markdown global. Retourne le texte directement.
        
        Retourne UNIQUEMENT le code Markdown de la note modifiée. Ne fais pas d'introduction ou de conclusion.

        Contenu original :
        """
        ${originalContent}
        """`;

        const modifiedContent = await this.llm.generate(prompt, { onToken });
        return this.cleanLLMOutput(modifiedContent);
    }
}