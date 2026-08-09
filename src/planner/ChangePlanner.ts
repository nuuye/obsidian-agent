import { Proposal } from "../core/types/Proposal";
import { ProposedChange } from "../core/types/Changes";

export class ChangePlanner {
    /**
     * Ne fait pas appel au LLM. Il transforme le Changes JSON en Proposal.
     */
    createProposal(originalContent: string, modifiedContent: string, changesJson: any): Proposal {
        const proposedChanges: ProposedChange[] = changesJson.changes.map((change: any) => ({
            id: change.id,
            type: change.type,
            description: change.description,
            status: "pending", // Initialisé en attente de validation
        }));

        return {
            originalContent,
            modifiedContent,
            changes: proposedChanges,
        };
    }
}
