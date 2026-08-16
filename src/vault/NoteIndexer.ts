import * as fs from "fs/promises";
import * as path from "path";

export class NoteIndexer {
    /**
    Browse a vault path and retrieve every note title inside an array
     */
    async getExistingNotes(vaultPath: string, noteTitle: string): Promise<string[]> {
        let results: string[] = [];

        try {
            const list = await fs.readdir(vaultPath, { withFileTypes: true });

            for (const dirent of list) {
                const fullPath = path.join(vaultPath, dirent.name);
                // ignoring hidden files and our backup folder if present
                if (dirent.name.startsWith(".") || dirent.name === "backups" || path.basename(dirent.name, ".md") == noteTitle) {
                    continue;
                }

                if (dirent.isDirectory()) {
                    // recursive call if our file is a folder
                    const subResults = await this.getExistingNotes(fullPath, noteTitle);
                    results = results.concat(subResults);
                } else if (dirent.isFile() && dirent.name.endsWith(".md")) {
                    // keeping only the file name and removing the .md extension
                    const noteName = path.basename(dirent.name, ".md");
                    results.push(noteName);
                }
            }
        } catch (error) {
            console.error(`Impossible d'indexer le dossier ${vaultPath} :`, error);
        }
        return results;
    }
}
