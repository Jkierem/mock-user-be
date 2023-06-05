import { Async as A } from "https://deno.land/x/jazzi@v3.0.7/mod.ts"
import { AsyncUIO } from "https://deno.land/x/jazzi@v3.0.7/Async/types.ts"

export interface Env {
    readFile: (path: string) => Promise<Uint8Array>,
    writeFile: (path: string, content: Uint8Array) => Promise<void>
    lstat: (path: string) => Promise<Deno.FileInfo>
}

export interface FileAdapter {
    read(path: string): AsyncUIO<Uint8Array>,
    write(path: string, content: Uint8Array): AsyncUIO<void>
    exists(path: string): AsyncUIO<boolean>
}

export class FileAdapterImpl implements FileAdapter {
    constructor(private env: Env){}
    exists(path: string): AsyncUIO<boolean> {
        return A.from(async () => {
            try {
                const data = await this.env.lstat(path);
                return data.isFile
            } catch {
                return false;
            }
        })
    }

    read(path: string): AsyncUIO<Uint8Array> {
        return A.from(() => this.env.readFile(path));
    }

    write(path: string, content: Uint8Array): AsyncUIO<void> {
        return A.from(() => this.env.writeFile(path, content));
    }
}

export const FileAdapterLive: FileAdapter = new FileAdapterImpl(Deno)