import { ProposedChange } from "./Changes.js";

export interface Proposal {
    originalContent: string;
    modifiedContent: string;
    changes: ProposedChange[];
}
