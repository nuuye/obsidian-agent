import { LLMProvider } from "../llm/types/LLMProvider.js";
import { Proposal } from "./types/Proposal.js";
import { FileReader } from "../vault/FileReader.js";
import { NoteAnalyzer } from "../analyzer/NoteAnalyzer.js";
import { NoteEditor } from "../editor/NoteEditor.js";
import { ChangeReviewer } from "../reviewer/ChangeReviewer.js";
import { ChangePlanner } from "../planner/ChangePlanner.js";
import { NoteIndexer } from "../vault/NoteIndexer.js";
import "dotenv/config";
import cliProgress from "cli-progress";
import * as path from "path";

export class Pipeline {
    private FileReader: FileReader;
    private analyzer: NoteAnalyzer;
    private editor: NoteEditor;
    private reviewer: ChangeReviewer;
    private planner: ChangePlanner;
    private indexer: NoteIndexer;

    constructor(private llmProvider: LLMProvider) {
        this.FileReader = new FileReader();
        this.analyzer = new NoteAnalyzer(this.llmProvider);
        this.editor = new NoteEditor(this.llmProvider);
        this.reviewer = new ChangeReviewer(this.llmProvider);
        this.planner = new ChangePlanner();
        this.indexer = new NoteIndexer();
    }

    async run(filePath: string): Promise<Proposal | null> {
        const totalSteps = 6;
        let existingNotes: string[] = [];
        let currentStatus = "Launching...";
        const noteTitle = path.basename(filePath, ".md");

        // Loading frames
        const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
        let frameIndex = 0;

        // On ajoute {spinner} et {status} dans le format de la barre
        const bar = new cliProgress.SingleBar({
            format: "{spinner} Avancement |{bar}| {percentage}% || Étape {value}/{total} || {status}",
            barCompleteChar: "\u2588",
            barIncompleteChar: "\u2591",
            hideCursor: true,
        });

        // function to spin the loader, the bar is not getting updated
        let spinnerTimer: NodeJS.Timeout | undefined;
        const startSpinner = () => {
            spinnerTimer = setInterval(() => {
                frameIndex = (frameIndex + 1) % frames.length;
                bar.update({ spinner: frames[frameIndex], status: currentStatus });
            }, 80);
        };

        console.log("\nLaunching Obsidian agent...\n");
        bar.start(totalSteps, 0, { spinner: frames[0], status: currentStatus });
        startSpinner();

        // Step 1 : Indexation
        currentStatus = "Indexing Vault...";
        const vaultPath = process.env.VAULT_PATH;
        if (vaultPath) {
            existingNotes = await this.indexer.getExistingNotes(vaultPath, noteTitle);
        }
        bar.update(1);

        // Step 2 : Reading the note
        currentStatus = `Reading ${noteTitle}...`;
        const originalContent = await this.FileReader.readNote(filePath);
        bar.update(2);

        // Step 3 : Analysis (generating a JSON)
        currentStatus = "Analyzing by LLM (thinking...)";
        const analysis = await this.analyzer.analyze(originalContent);
        bar.update(3);

        // Step 4 : Editing (cutting the loader in order to display the stream properly)
        clearInterval(spinnerTimer);
        bar.stop();

        console.log("\n\nGenerating the new note :\n");
        console.log("----------------------------------------");

        const modifiedContent = await this.editor.edit(originalContent, analysis, existingNotes, (chunk) => {
            process.stdout.write(chunk);
        });

        console.log("\n----------------------------------------\n");

        // Resuming the loader to end the pipeline
        currentStatus = "Comparing old and new version (Generating JSON)...";
        bar.start(totalSteps, 4, { spinner: frames[frameIndex], status: currentStatus });
        startSpinner();

        // Step 5 : Comparing and generating a JSON with all the changes
        const changesJson = await this.reviewer.review(originalContent, modifiedContent);
        bar.update(5);

        // Step 6 : Planification
        currentStatus = "Creating a sum up of all the changes...";
        const proposal = this.planner.createProposal(originalContent, modifiedContent, changesJson);
        bar.update(6, { status: "Done!" });

        // End
        clearInterval(spinnerTimer);
        bar.stop();

        console.log(analysis);
        return proposal;
    }
}
