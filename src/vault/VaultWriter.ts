import * as fs from "fs/promises";
import * as path from "path";

export class VaultWriter {
    /**
     * Save the original content in a backup directory at root
     */
    async backupNote(filePath: string, originalContent: string): Promise<void> {
        try {
            const baseName = path.basename(filePath, ".md");

            const backupDir = "./backups";

            await fs.mkdir(backupDir, { recursive: true });

            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const backupPath = path.join(backupDir, `${baseName}_backup_${timestamp}.md`);

            await fs.writeFile(backupPath, originalContent, "utf-8");
            console.log(`Sucessfully created backup : ${backupPath}`);
        } catch (error) {
            throw new Error(`Impossible de créer le backup pour ${filePath} : ${error}`);
        }
    }

    /**
     * Write the final content of the obsidian note
     */
    async writeNote(filePath: string, content: string): Promise<void> {
        try {
            await fs.writeFile(filePath, content, "utf-8");
            console.log(`[SUCCESS] File saved : ${filePath}`);
        } catch (error) {
            throw new Error(`Unable to write file ${filePath} : ${error}`);
        }
    }
}
