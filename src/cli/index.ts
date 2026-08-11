import { Pipeline } from "../core/Pipeline.js";
import { OllamaProvider } from "../llm/OllamaProvider.js";
import { UserInterface } from "./UserInterface.js";
import { MarkdownEditor } from "../markdown/MarkdownEditor.js";
import { VaultWriter } from "../vault/VaultWriter.js";
import { GroqProvider } from "../llm/GroqProvider.js";
import 'dotenv/config';

async function main() {
    const args = process.argv.slice(2);
    const filePath = args[0];

    if (!filePath) {
        console.error("Erreur : Veuillez fournir le chemin vers la note Obsidian.");
        process.exit(1);
    }

    const modelName = process.env.GROQ_LLM_MODEL || "llama3-8b-8192";
    
    console.log(`\nModèle LLM chargé via Groq : \x1b[36m${modelName}\x1b[0m\n`);

    // Initialisation des dépendances (tu peux changer "mistral" par "llama3" selon ton modèle local)
    //const llmProvider = new OllamaProvider(process.env.LLM_MODEL);
    const llmProvider = new GroqProvider(modelName);
    const pipeline = new Pipeline(llmProvider);
    const ui = new UserInterface();
    const markdownEditor = new MarkdownEditor();
    const vaultWriter = new VaultWriter();

    try {
        // 1. Exécution du pipeline complet
        const proposal = await pipeline.run(filePath);

        if (!proposal) {
            console.log("Processus interrompu ou aucune proposition générée.");
            return;
        }

        // 2. Validation par l'utilisateur
        const acceptedChanges = await ui.promptValidation(proposal);

        // 3. Application des modifications
        const finalContent = markdownEditor.applyChanges(proposal, acceptedChanges);

        // 4. Sauvegarde sécurisée
        if (acceptedChanges.length > 0) {
            console.log("\nPréparation de l'enregistrement...");

            // -> NOUVEAU : Création du backup avant toute modification
            await vaultWriter.backupNote(filePath, proposal.originalContent);

            // Écrasement du fichier avec les nouvelles données
            await vaultWriter.writeNote(filePath, finalContent);
        } else {
            console.log("Aucun changement appliqué. Le fichier original reste intact.");
        }
    } catch (error) {
        console.error("\nUne erreur critique est survenue :", error);
    }
}

main();
