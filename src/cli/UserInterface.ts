import { checkbox } from "@inquirer/prompts";
import { Proposal } from "../core/types/Proposal.js";
import { ProposedChange } from "../core/types/Changes.js";

export class UserInterface {
    /**
     * Présente le Proposal à l'utilisateur via un menu interactif et
     * retourne la liste des changements avec leur nouveau statut.
     */
    async promptValidation(proposal: Proposal): Promise<ProposedChange[]> {
        console.log("\n========================================");
        console.log("ANALYSE TERMINÉE : PROPOSITION DE MODIFICATIONS");
        console.log("========================================\n");

        if (proposal.changes.length === 0) {
            console.log("Aucun changement significatif n'a été détecté par l'agent.");
            return [];
        }

        // 1. On prépare les choix pour le prompt Inquirer
        const choices = proposal.changes.map((change) => ({
            name: `[${change.type.toUpperCase()}] ${change.description}`,
            value: change.id, // C'est l'ID qui sera retourné par Inquirer
            checked: true, // Par défaut, on présélectionne tous les changements
        }));

        // 2. On lance l'interface interactive dans le terminal
        const selectedChangeIds = await checkbox({
            message: "Utilisez [Espace] pour sélectionner/désélectionner, et [Entrée] pour valider :",
            choices: choices,
            loop: false, // Empêche le curseur de boucler de bas en haut pour plus de clarté
        });

        // 3. On met à jour le statut de chaque changement en fonction des choix
        const finalChanges = proposal.changes.map((change) => {
            const isAccepted = selectedChangeIds.includes(change.id);
            return {
                ...change,
                status: (isAccepted ? "accepted" : "rejected") as "accepted" | "rejected",
            };
        });

        // Petit feedback visuel après validation
        const acceptedCount = finalChanges.filter((c) => c.status === "accepted").length;
        console.log(`\n👉 Vous avez accepté ${acceptedCount} changement(s) sur ${proposal.changes.length}.`);

        // On retourne uniquement les changements acceptés pour la suite du pipeline
        return finalChanges.filter((c) => c.status === "accepted");
    }
}
