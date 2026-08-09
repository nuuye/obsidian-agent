import { Proposal } from "../core/types/Proposal.js";
import { ProposedChange } from "../core/types/Changes.js";

export class MarkdownEditor {
    /**
     * Construit le contenu final de la note en fonction des changements acceptés.
     */
    applyChanges(proposal: Proposal, acceptedChanges: ProposedChange[]): string {
        // Si l'utilisateur a tout refusé, on retourne l'original
        if (acceptedChanges.length === 0) {
            return proposal.originalContent;
        }

        // Si l'utilisateur a tout accepté, on retourne la version modifiée complète
        if (acceptedChanges.length === proposal.changes.length) {
            return proposal.modifiedContent;
        }

        // TODO: Implémenter la logique complexe d'application partielle des modifications.
        // Cela nécessite généralement d'utiliser les diffs ou de refaire un appel ciblé au LLM.
        console.warn(
            "[WARN] L'application partielle des changements n'est pas encore complètement implémentée. Application totale par défaut."
        );
        return proposal.modifiedContent;
    }
}
