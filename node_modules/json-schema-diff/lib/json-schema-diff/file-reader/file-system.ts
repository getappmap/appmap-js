import * as fs from 'fs';

export class FileSystem {
    public readFile(path: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            fs.readFile(path, (error, data) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(data.toString());
            });
        });
    }
}
