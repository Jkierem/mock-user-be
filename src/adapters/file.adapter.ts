import * as A from "https://deno.land/x/jazzi@v4.0.0/Async/mod.ts"

export interface Env {
    readFile: (path: string) => Promise<Uint8Array>,
    writeFile: (path: string, content: Uint8Array) => Promise<void>
    lstat: (path: string) => Promise<Deno.FileInfo>
}

export interface FileAdapter {
    read(path: string): A.AsyncUIO<Uint8Array>,
    write(path: string, content: Uint8Array): A.AsyncUIO<void>
    exists(path: string): A.AsyncUIO<boolean>
}

export class FileAdapterImpl implements FileAdapter {
    constructor(private env: Env){}
    exists(path: string): A.AsyncUIO<boolean> {
        return A.from(async () => {
            try {
                const data = await this.env.lstat(path);
                return data.isFile
            } catch {
                return false;
            }
        }) as A.AsyncUIO<boolean>
    }

    read(path: string): A.AsyncUIO<Uint8Array> {
        return A.from(() => this.env.readFile(path)) as A.AsyncUIO<Uint8Array>;
    }

    write(path: string, content: Uint8Array): A.AsyncUIO<void> {
        return A.from(() => this.env.writeFile(path, content)) as A.AsyncUIO<void>;
    }
}

export const FileAdapterLive: FileAdapter = new FileAdapterImpl(Deno)