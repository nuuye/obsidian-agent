import * as fs from "fs/promises";
import * as path from "path";

export class VaultWriter {
    /**
     * Sauvegarde le contenu original dans un dossier 'backups' situé
     * dans le même répertoire que la note cible.
     */
    async backupNote(filePath: string, originalContent: string): Promise<void> {
        try {
            const baseName = path.basename(filePath, ".md");

            // Création du chemin vers le dossier backups
            const backupDir = "./backups";

            // Création du dossier s'il n'existe pas déjà
            await fs.mkdir(backupDir, { recursive: true });

            // Génération d'un horodatage propre (ex: 2024-05-20T14-30-00)
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const backupPath = path.join(backupDir, `${baseName}_backup_${timestamp}.md`);

            // Écriture du fichier de secours
            await fs.writeFile(backupPath, originalContent, "utf-8");
            console.log(`Backup créé avec succès : ${backupPath}`);
        } catch (error) {
            // Si le backup échoue, on lève une erreur pour empêcher l'écrasement du fichier original
            throw new Error(`Impossible de créer le backup pour ${filePath} : ${error}`);
        }
    }

    /**
     * Écrit le contenu final de la note Obsidian.
     * N'est appelé qu'APRÈS la validation par l'utilisateur ET la création du backup.
     */
    async writeNote(filePath: string, content: string): Promise<void> {
        try {
            await fs.writeFile(filePath, content, "utf-8");
            console.log(`[SUCCESS] Fichier sauvegardé avec succès : ${filePath}`);
        } catch (error) {
            throw new Error(`Impossible d'écrire le fichier ${filePath} : ${error}`);
        }
    }
}
