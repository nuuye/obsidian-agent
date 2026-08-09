export interface GenerateOptions {
    skipThinking?: boolean;
}

export interface LLMProvider {
    generate(prompt: string, options?: GenerateOptions): Promise<string>;
}
