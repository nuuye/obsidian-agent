import { LLMProvider } from "../llm/LLMProvider.js";
import { Analysis } from "../core/types/Analysis.js";
import { mermaidSyntaxExamples } from "../constants.js";

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
        const indexingPrompt =
            existingNotes && existingNotes.length > 0
                ? `4. LIENS : Voici la liste exacte des autres notes existantes dans le Vault : [${existingNotes.join(
                        ", "
                    )}]. Si un concept de cette liste est mentionné, transforme-le en lien Obsidian (ex: [[Concept]]). N'invente AUCUN lien vers des notes qui ne sont pas dans cette liste.`
                : "";

        const gaps = (analysis.missingInformation ?? []).filter((m) => m.origin === "gap");
        const doubts = (analysis.missingInformation ?? []).filter((m) => m.origin === "authorDoubt");

        const commonGoldenRules = `
            -> Règle d'or 1 : ADAPTE LE FORMAT. Si l'explication est concise, utilise une LISTE À PUCES avec autant de points que nécessaire, sans forcer sur du contenu non substantiel. Si le concept nécessite une explication plus longue ou complexe, utilise des paragraphes structurés avec des sous-titres Markdown (###).
            -> Règle d'or 2 : N'utilise JAMAIS du texte en gras comme substitut à un titre Markdown. Si tu structures avec des sous-parties, utilise systématiquement ### (ou ##### selon le niveau de la note), jamais du gras en début de ligne.
            -> Règle d'or 3 : INSÈRE l'enrichissement à l'endroit le plus cohérent avec la structure narrative existante (par exemple après un exemple qui illustre déjà le concept, pas avant). Ne casse jamais un enchaînement logique existant (explication → exemple → conclusion).
            -> Règle d'or 4 : Si l'information est déjà présente ailleurs dans la note (tableau, phrase existante), NE LA RÉPÈTE PAS. Reste aussi concis que possible : privilégie une phrase dense plutôt qu'une liste si le concept est simple.
            -> Règle d'or 5 : COHÉRENCE FACTUELLE ET DOMAINE. Avant d'ajouter un exemple ou un chiffre, vérifie qu'il ne contredit AUCUNE donnée déjà présente dans la note (tableaux inclus). N'utilise QUE des exemples appartenant au domaine déjà couvert par la note (ici : inférence de LLM local, assistants conversationnels, génération de texte/code). 
            -> Règle d'or 6 : Chaque point d'une liste doit apporter une information distincte des autres — ne réutilise jamais la même formulation pour deux entrées différentes.
            -> Règle d'or 7 : NE MODIFIE JAMAIS le contenu d'un tableau Markdown déjà présent dans la note (valeurs, symboles comme "<" ou ">", unités, libellés de colonnes), sauf si une règle d'enrichissement te demande explicitement d'y ajouter une ligne ou une colonne. Recopie tout tableau non concerné strictement à l'identique, caractère pour caractère.
            -> Règle d'or 8 : COHÉRENCE INTERNE DES INTERPRÉTATIONS. Si tu interprètes un symbole ou une convention (ex: le "<" d'un tableau) dans un exemple, applique EXACTEMENT LA MÊME interprétation à tous les exemples suivants du même symbole dans le même paragraphe. Ne dis jamais "moins de X" pour un cas puis "plus de X" pour un autre cas du même symbole — vérifie la cohérence logique entre tes propres phrases avant de les inclure.`;

        const gapsPrompt =
            gaps.length > 0
                ? `5. ENRICHISSEMENT (concepts absents) : Tu dois expliquer les concepts suivants, absents de la note : ${gaps
                        .map((m) => m.topic)
                        .join(", ")}.
            -> Règle d'or 2bis : SUPPRIME ou REFORMULE les phrases de la note originale qui indiquaient un besoin d'apprendre ou de comprendre ces concepts (ex: "Je dois encore comprendre...").
            ${commonGoldenRules}`
                : "";

        const doubtsPrompt =
            doubts.length > 0
                ? `${
                        gaps.length > 0 ? "5bis" : "5"
                    }. CLARIFICATION (doutes de l'auteur) : L'auteur exprime un doute ou une incertitude sur les points suivants :
            ${doubts
                .map(
                    (m, i) =>
                        `   ${i + 1}. Concept : "${m.topic}" — Extrait concerné : "${
                            m.quote ?? ""
                        }" — Ce qu'il faut clarifier : ${m.reason}`
                )
                .join("\n            ")}

            -> FORMAT DE SORTIE OBLIGATOIRE POUR CHAQUE DOUTE : une reformulation qui REMPLACE directement l'extrait cité, intégrée dans le paragraphe existant. JAMAIS une nouvelle section, un nouveau titre, ou une liste à puces séparée. Le doute doit disparaître DANS le texte, pas être suivi d'un bloc d'explication à côté.
            
            -> Exemple de transformation attendue :
                AVANT (extrait de note) : "Mais alors les Implications ?\\nPerte de précision pour des longs prompts ou des longs calculs."
                APRÈS (attendu)         : "Cela implique une perte de précision pour les prompts longs ou les calculs complexes, un effet plus marqué sur les quantifications élevées comme Q4 ou Q5."
                (Remarque : pas de titre, pas de gras, pas de liste — une reformulation fondue dans le texte existant.)

            -> Règle d'or A : NE TE CONTENTE PAS D'AJOUTER une explication à côté de l'extrait. REFORMULE DIRECTEMENT la phrase concernée pour intégrer la clarification, en gardant l'extrait original comme point d'ancrage (même idée, formulation plus assurée et précise).
            -> Règle d'or B : Supprime la tournure de doute elle-même (ex: "en quelque sorte", "je crois", "dans une certaine mesure") une fois la clarification intégrée — l'auteur n'a plus besoin d'exprimer d'incertitude sur un point désormais expliqué.
            -> Règle d'or C : Ne transforme pas une prudence académique légitime (ex: "généralement", "dans la plupart des cas") en affirmation absolue. Le but est de clarifier le concept, pas de supprimer toute nuance justifiée.
            ${commonGoldenRules}`
                : "";

        const prompt = `Tu dois proposer une version améliorée de cette note Obsidian.
        
        Règles à respecter STRICTEMENT :
        1. Corriger les fautes et le formatage Markdown (y compris les erreurs de locutions et expressions figées, ex: "en quelques sortes" → "en quelque sorte").
        2. Préserver le style de l'auteur : Ton = ${
            analysis.writingStyle.tone
        }. Le texte ajouté doit être indiscernable de l'original en termes de densité et de format — n'invente pas de titres en gras façon "listicle" si l'auteur n'en utilise pas ailleurs dans la note.
        3. Mets en gras les concepts clés de la note ou les mots qui sont importants pour comprendre un concept rapidement.
        4. Ne supprimer aucune information existante pertinente. (Tu es autorisé à supprimer ou reformuler les phrases obsolètes ou exprimant un doute selon les règles d'enrichissement/clarification si elles s'appliquent).
        ${indexingPrompt}
        ${gapsPrompt}
        ${doubtsPrompt}
        6. ${
            analysis.schema.useful && analysis.schema.score > 0.63
                ? `SCHÉMA MERMAID OBLIGATOIRE :
                    - Ajoute TOUJOURS un schéma Mermaid à la fin de la note.
                    - Le diagramme doit se limiter STRICTEMENT au sujet suivant, tel qu'identifié par l'analyse : "${
                        analysis.schema.reason
                    }". 
                        N'y intègre AUCUNE autre section ajoutée ailleurs dans la note (ex: un enrichissement ou une clarification ajoutés séparément), sauf si elle fait partie intrinsèque du même flux de relations décrit ci-dessus.
                    - Utilise IMPÉRATIVEMENT la syntaxe suivante, propre au type "${
                        analysis.schema.type
                    }" (ne mélange jamais les syntaxes d'autres types):

                    ${mermaidSyntaxExamples[analysis.schema.type].example}

                    - RÈGLE POUR CE TYPE : ${mermaidSyntaxExamples[analysis.schema.type].rule}
                    - N'invente AUCUNE relation causale ou séquentielle entre des concepts qui sont en réalité indépendants. Si les concepts sont des dimensions parallèles (pas un flux), utilise un format adapté.
                    - Le Schéma doit commencer par \`\`\`mermaid et se terminer par \`\`\`.
                    - REGLE FINALE ET ABSOLUE : Le Schema doit être CONSCIT et faire un résumé du sujet.`
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