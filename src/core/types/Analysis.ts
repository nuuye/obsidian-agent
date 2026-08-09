export interface MissingInformation {
    topic: string;
    reason: string;
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
        type: string;
        reason: string;
    };
    missingInformation: MissingInformation[];
}
