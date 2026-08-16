import { Proposal } from "../core/types/Proposal.js";
import { ProposedChange } from "../core/types/Changes.js";

export class ChangePlanner {
    /**
     * Changing changes into proposal for the user. Not calling any LLM
     */
    createProposal(originalContent: string, modifiedContent: string, changesJson: any): Proposal {
        
        const rawChanges = Array.isArray(changesJson?.changes) ? changesJson.changes : [];
        if (rawChanges.length === 0 && changesJson?.changes !== undefined) {
            console.warn("[WARN] The JSON provided by the change reviewer is not exploitable");
        }

        const proposedChanges: ProposedChange[] = rawChanges.map((change: any) => ({
            id: change.id,
            type: change.type,
            description: change.description,
            status: "pending", // Awaiting validation
        }));

        return {
            originalContent,
            modifiedContent,
            changes: proposedChanges,
        };
    }
}