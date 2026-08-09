import { LLMProvider } from "../llm/LLMProvider";
import { Proposal } from "./types/Proposal";
import { VaultReader } from "../vault/VaultReader";
import { NoteAnalyzer } from "../analyzer/NoteAnalyzer";
import { NoteEditor } from "../editor/NoteEditor";
import { ChangeReviewer } from "../reviewer/ChangeReviewer";
import { ChangePlanner } from "../planner/ChangePlanner";

export class Pipeline {
    private vaultReader: VaultReader;
    private analyzer: NoteAnalyzer;
    private editor: NoteEditor;
    private reviewer: ChangeReviewer;
    private planner: ChangePlanner;

    constructor(private llmProvider: LLMProvider) {
        this.vaultReader = new VaultReader();
        this.analyzer = new NoteAnalyzer(this.llmProvider);
        this.editor = new NoteEditor(this.llmProvider);
        this.reviewer = new ChangeReviewer(this.llmProvider);
        this.planner = new ChangePlanner();
    }

    async run(filePath: string): Promise<Proposal | null> {
        console.log("1. Lecture de la note...");
        const originalContent = await this.vaultReader.readNote(filePath);

        console.log("2. Analyse par le LLM...");
        const analysis = await this.analyzer.analyze(originalContent);

        console.log("3. Génération de la version améliorée (en mémoire)...");
        const modifiedContent = await this.editor.edit(originalContent, analysis);

        console.log("4. Comparaison des versions...");
        const changesJson = await this.reviewer.review(originalContent, modifiedContent);

        console.log("5. Planification de la proposition...");
        const proposal = this.planner.createProposal(originalContent, modifiedContent, changesJson);

        return proposal;
    }
}
