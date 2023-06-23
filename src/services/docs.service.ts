import * as A from "https://deno.land/x/jazzi@v4.1.0/Async/mod.ts"
import { FileAdapter, FileAdapterLive } from "../adapters/file.adapter.ts";
import * as hx from "../support/html.ts"
import Docs from "../docs/index.ts";

export interface DocsService {
    get(): A.AsyncUIO<string>;
}

export class DocsServiceImpl implements DocsService {
    constructor(private adapter: FileAdapter){}

    get(){
        return this.adapter.read("./src/data/shell.html")
            ["|>"](A.map(x => new TextDecoder().decode(x)))
            ["|>"](A.map(shell => shell.replace("{{body}}", hx.render(Docs()))))
    }
}

export const DocsServiceLive: DocsService = new DocsServiceImpl(FileAdapterLive);