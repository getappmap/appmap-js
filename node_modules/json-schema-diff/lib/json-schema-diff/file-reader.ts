import {VError} from 'verror';
import {FileSystem} from './file-reader/file-system';

export class FileReader {
    public constructor(private readonly fileSystem: FileSystem) {}

    public async read(filePath: string): Promise<string> {
        try {
            return await this.fileSystem.readFile(filePath);
        } catch (error) {
            throw new VError(error, '%s', `Error loading "${filePath}"`);
        }
    }
}
