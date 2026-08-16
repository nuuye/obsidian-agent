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
        console.error("Error: Please provide the path to the obsidian note.");
        process.exit(1);
    }

    const modelName = process.env.GROQ_LLM_MODEL || "openai/gpt-oss-120b";
    
    const llmProvider = new GroqProvider(modelName);
    const pipeline = new Pipeline(llmProvider);
    const ui = new UserInterface();
    const markdownEditor = new MarkdownEditor();
    const vaultWriter = new VaultWriter();
    
    console.log(`\nLLM model loaded with Groq : \x1b[36m${modelName}\x1b[0m\n`);

    try {
        // 1. Executing the complete pipeline
        const proposal = await pipeline.run(filePath);

        if (!proposal) {
            console.log("Error while running the pipeline or lack of proposal.");
            return;
        }

        // 2. User validation for each change
        const acceptedChanges = await ui.promptValidation(proposal);

        // 3.Applying modifications
        const finalContent = markdownEditor.applyChanges(proposal, acceptedChanges);

        // 4.Secured save
        if (acceptedChanges.length > 0) {
            console.log("\nProcessing save...");

            // Creating a backup
            await vaultWriter.backupNote(filePath, proposal.originalContent);

            // Overwrite the file with new data
            await vaultWriter.writeNote(filePath, finalContent);
        } else {
            console.log("No changes applied. Original file remain the same.");
        }
    } catch (error) {
        console.error("\nError during pipeline execution :", error);
    }
}

main();
