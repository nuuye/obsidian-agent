import { LLMProvider } from "./LLMProvider.js";

export class OllamaProvider implements LLMProvider {
    async generate(prompt: string): Promise<string> {
        throw new Error("OllamaProvider not implemented yet.");
    }
}
