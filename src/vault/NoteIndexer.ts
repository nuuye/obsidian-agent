import * as fs from "fs/promises";
import * as path from "path";

export class NoteIndexer {
    /**
     * Parcourt le Vault récursivement et retourne la liste des noms de notes existantes
     * (sans l'extension .md), qui représentent tes "Concepts" disponibles.
     */
    async getExistingNotes(dirPath: string): Promise<string[]> {
        let results: string[] = [];

        try {
            const list = await fs.readdir(dirPath, { withFileTypes: true });

            for (const dirent of list) {
                const fullPath = path.join(dirPath, dirent.name);

                // On ignore les dossiers cachés (comme .obsidian ou .git) et notre dossier backups
                if (dirent.name.startsWith(".") || dirent.name === "backups") {
                    continue;
                }

                if (dirent.isDirectory()) {
                    // Appel récursif pour les sous-dossiers
                    const subResults = await this.getExistingNotes(fullPath);
                    results = results.concat(subResults);
                } else if (dirent.isFile() && dirent.name.endsWith(".md")) {
                    // On garde juste le nom du fichier sans ".md"
                    const noteName = path.basename(dirent.name, ".md");
                    results.push(noteName);
                }
            }
        } catch (error) {
            console.error(`⚠️ Impossible d'indexer le dossier ${dirPath} :`, error);
        }

        return results;
    }
}
