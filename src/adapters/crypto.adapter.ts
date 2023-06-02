import { Async } from "https://deno.land/x/jazzi@v3.0.4/mod.ts";
import { AsyncUIO } from "https://deno.land/x/jazzi@v3.0.4/Async/types.ts";

export interface CryptoAdapter {
    randomUUID(): AsyncUIO<string>
}

export class CryptoAdapterImpl implements CryptoAdapter {
    constructor(private crypto: typeof globalThis.crypto){}

    randomUUID(): AsyncUIO<string> {
        return Async.of(() => this.crypto.randomUUID());
    }       
}

export const CryptoAdapterLive: CryptoAdapter = new CryptoAdapterImpl(globalThis.crypto)