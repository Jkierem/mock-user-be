import * as A from "https://deno.land/x/jazzi@v4.0.0/Async/mod.ts";

export interface CryptoAdapter {
    randomUUID(): A.AsyncUIO<string>
}

export class CryptoAdapterImpl implements CryptoAdapter {
    constructor(private crypto: typeof globalThis.crypto){}

    randomUUID(): A.AsyncUIO<string> {
        return A.succeedWith(() => this.crypto.randomUUID());
    }
}

export const CryptoAdapterLive: CryptoAdapter = new CryptoAdapterImpl(globalThis.crypto)