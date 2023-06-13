import * as A from "https://deno.land/x/jazzi@v4.1.0/Async/mod.ts"
import { FileAdapter, FileAdapterLive } from "../adapters/file.adapter.ts";

export interface FileService {
    read(path: string): A.AsyncUIO<string>
    write(path: string, content: string): A.AsyncUIO<void>
    exists(path: string): A.AsyncUIO<boolean>
}

export class FileServiceImpl implements FileService {
    constructor(private adapter: FileAdapter){}

    exists(path: string): A.AsyncUIO<boolean> {
        return this.adapter.exists(path);
    }

    read(path: string){
        return this.adapter.read(path)
            ['|>'](A.map(uint => new TextDecoder().decode(uint)))
    }

    write(path: string, content: string){
        return A
            .Succeed(content)
            ['|>'](A.map(str => new TextEncoder().encode(str)))
            ['|>'](A.chain(data => this.adapter.write(path, data)))
    }

}

export const FileServiceLive = new FileServiceImpl(FileAdapterLive)