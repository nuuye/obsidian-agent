export interface MissingInformation {
    topic: string;
    reason: string;
    origin: "gap" | "authorDoubt"; // "gap" = absent de la note, "authorDoubt" = présent mais formulé avec incertitude
    quote?: string; // extrait exact de la note qui a déclenché la détection
}

export interface Analysis {
    summary: string;
    topics: string[];
    writingStyle: {
        language: string;
        tone: string;
        structure: string;
    };
    schema: {
        useful: boolean;
        score: number;
        type: "graph TD" | "sequenceDiagram" | "timeline";
        reason: string;
    };
    missingInformation: MissingInformation[];
}
