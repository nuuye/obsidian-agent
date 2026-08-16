import * as fs from "fs/promises";

export class FileReader {
    /**
     * Read the content of an obsidian note.
     */
    async readNote(filePath: string): Promise<string> {
        try {
            const content = await fs.readFile(filePath, "utf-8");
            return content;
        } catch (error) {
            throw new Error(`Unable to read the file ${filePath}: ${error}`);
        }
    }
}
