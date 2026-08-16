import { checkbox } from "@inquirer/prompts";
import { Proposal } from "../core/types/Proposal.js";
import { ProposedChange } from "../core/types/Changes.js";

export class UserInterface {
    /**
     * Giving a proposal to the user with an interactive menu
     * return the change list with updated status
     */
    async promptValidation(proposal: Proposal): Promise<ProposedChange[]> {
        console.log("\n========================================");
        console.log("END OF ANALYSIS: MODIFICATIONS PROPOSAL");
        console.log("========================================\n");

        if (proposal.changes.length === 0) {
            console.log("No proposal was given by the agent.");
            return [];
        }

        // 1. Preparing choices for the prompt inquirer
        const choices = proposal.changes.map((change) => ({
            name: `[${change.type.toUpperCase()}] ${change.description}`,
            value: change.id,
            checked: true, // we accept all changes by default
        }));

        // 2. Launching interactive interface in the terminal
        const selectedChangeIds = await checkbox({
            message: "Use [space] for selecting/unselecting, and [Enter] to accept :",
            choices: choices,
            loop: false,
        });

        // 3. Updating status depending on user's choice
        const finalChanges = proposal.changes.map((change) => {
            const isAccepted = selectedChangeIds.includes(change.id);
            return {
                ...change,
                status: (isAccepted ? "accepted" : "rejected") as "accepted" | "rejected",
            };
        });

        // Small visual feedback
        const acceptedCount = finalChanges.filter((c) => c.status === "accepted").length;
        console.log(`\n👉 You accepted ${acceptedCount} change(s) on ${proposal.changes.length}.`);

        // Returning only accepted changes
        return finalChanges.filter((c) => c.status === "accepted");
    }
}
