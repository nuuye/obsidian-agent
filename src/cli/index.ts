import { Pipeline } from "../core/Pipeline";
import { OllamaProvider } from "../llm/OllamaProvider";

async function main() {
    const args = process.argv.slice(2);
    const filePath = args[0];

    if (!filePath) {
        console.error("Erreur : Veuillez fournir le chemin vers la note Obsidian.");
        console.log("Exemple : npm run dev -- /chemin/vers/vault/Inbox/docker.md");
        process.exit(1);
    }

    console.log(`Démarrage de l'agent pour : ${filePath}`);

    // Injection de dépendance basique
    const llmProvider = new OllamaProvider();
    const pipeline = new Pipeline(llmProvider);

    try {
        const proposal = await pipeline.run(filePath);

        // TODO: Interface interactive CLI (ex: Inquirer.js) pour présenter le "Proposal"
        // et permettre à l'utilisateur d'accepter/refuser les changements.

        console.log("Analyse terminée. En attente de l'implémentation de l'interface de validation.");
    } catch (error) {
        console.error("Une erreur critique est survenue :", error);
    }
}

main();
