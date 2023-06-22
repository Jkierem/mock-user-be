import * as A from "https://deno.land/x/jazzi@v4.1.0/Async/mod.ts"
import { FileAdapter, FileAdapterLive } from "../adapters/file.adapter.ts";

export interface DocsService {
    get(): A.AsyncUIO<string>;
}

export class DocsServiceImpl implements DocsService {
    constructor(private adapter: FileAdapter){}

    get(){
        return this.adapter.read("./src/data/docs.html")
            ["|>"](A.map(x => new TextDecoder().decode(x)))
    }
}

export const DocsServiceLive: DocsService = new DocsServiceImpl(FileAdapterLive);