import * as fs from "fs/promises";

export class VaultReader {
    /**
     * Lit le contenu d'une note Obsidian.
     * L'application ne modifie jamais directement le fichier original avant validation.
     */
    async readNote(filePath: string): Promise<string> {
        try {
            const content = await fs.readFile(filePath, "utf-8");
            return content;
        } catch (error) {
            throw new Error(`Impossible de lire le fichier ${filePath}: ${error}`);
        }
    }
}
