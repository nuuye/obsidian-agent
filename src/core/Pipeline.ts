import { LLMProvider } from "../llm/LLMProvider.js";
import { Proposal } from "./types/Proposal.js";
import { VaultReader } from "../vault/VaultReader.js";
import { NoteAnalyzer } from "../analyzer/NoteAnalyzer.js";
import { NoteEditor } from "../editor/NoteEditor.js";
import { ChangeReviewer } from "../reviewer/ChangeReviewer.js";
import { ChangePlanner } from "../planner/ChangePlanner.js";
import { NoteIndexer } from "../vault/NoteIndexer.js";
import "dotenv/config";
import cliProgress from "cli-progress";

export class Pipeline {
    private vaultReader: VaultReader;
    private analyzer: NoteAnalyzer;
    private editor: NoteEditor;
    private reviewer: ChangeReviewer;
    private planner: ChangePlanner;
    private indexer: NoteIndexer;

    constructor(private llmProvider: LLMProvider) {
        this.vaultReader = new VaultReader();
        this.analyzer = new NoteAnalyzer(this.llmProvider);
        this.editor = new NoteEditor(this.llmProvider);
        this.reviewer = new ChangeReviewer(this.llmProvider);
        this.planner = new ChangePlanner();
        this.indexer = new NoteIndexer();
    }

    async run(filePath: string): Promise<Proposal | null> {
        const totalSteps = 6;
        let existingNotes: string[] = [];
        let currentStatus = "Démarrage...";

        // Les "frames" de notre petit loader animé
        const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
        let frameIndex = 0;

        // On ajoute {spinner} et {status} dans le format de la barre
        const bar = new cliProgress.SingleBar({
            format: "{spinner} Avancement |{bar}| {percentage}% || Étape {value}/{total} || {status}",
            barCompleteChar: "\u2588",
            barIncompleteChar: "\u2591",
            hideCursor: true,
        });

        // Fonction pour faire tourner le loader visuellement sans avancer les étapes
        let spinnerTimer: NodeJS.Timeout | undefined;
        const startSpinner = () => {
            spinnerTimer = setInterval(() => {
                frameIndex = (frameIndex + 1) % frames.length;
                bar.update({ spinner: frames[frameIndex], status: currentStatus });
            }, 80);
        };

        console.log("\nLancement de l'agent Obsidian...\n");
        bar.start(totalSteps, 0, { spinner: frames[0], status: currentStatus });
        startSpinner();

        // Étape 1 : Indexation
        currentStatus = "Indexation du Vault...";
        const vaultPath = process.env.VAULT_PATH;
        if (vaultPath) {
            existingNotes = await this.indexer.getExistingNotes(vaultPath);
        }
        bar.update(1);

        // Étape 2 : Lecture de la note
        currentStatus = "Lecture de la note...";
        const originalContent = await this.vaultReader.readNote(filePath);
        bar.update(2);

        // Étape 3 : Analyse
        currentStatus = "Analyse par le LLM (Réflexion en cours)...";
        const analysis = await this.analyzer.analyze(originalContent);
        bar.update(3);

        // Étape 4 : Édition (On coupe le loader pour afficher le streaming proprement)
        clearInterval(spinnerTimer);
        bar.stop();

        console.log("\n\nGénération de la nouvelle note en cours :\n");
        console.log("----------------------------------------");

        const modifiedContent = await this.editor.edit(originalContent, analysis, existingNotes, (chunk) => {
            process.stdout.write(chunk);
        });

        console.log("\n----------------------------------------\n");

        // Reprise du loader pour la fin du pipeline
        currentStatus = "Comparaison des versions (Génération du JSON)...";
        bar.start(totalSteps, 4, { spinner: frames[frameIndex], status: currentStatus });
        startSpinner();

        // Étape 5 : Comparaison
        const changesJson = await this.reviewer.review(originalContent, modifiedContent);
        bar.update(5);

        // Étape 6 : Planification
        currentStatus = "Planification des propositions...";
        const proposal = this.planner.createProposal(originalContent, modifiedContent, changesJson);
        bar.update(6, { status: "Terminé !" });

        // Fin totale
        clearInterval(spinnerTimer);
        bar.stop();
        
        console.log(analysis)
        return proposal;
    }
}
