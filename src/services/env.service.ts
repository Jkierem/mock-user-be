import { Either as E } from "https://deno.land/x/jazzi@v3.0.7/mod.ts"
import { Either } from "https://deno.land/x/jazzi@v3.0.7/Either/types.ts"

export const getEnv = (str: string, def: string): Either<string, string> => {
    if( Deno.env.has(str) ){
        return E.Right(Deno.env.get(str) as string);
    } else {
        return E.Left(def);
    }
}

interface DenoEnv {
    env: {
        has(str: string): boolean
        get(str: string): string | undefined
    }
}

export interface EnvService {
    get(key: string, def: string): Either<string, string>
}

export class EnvServiceImpl implements EnvService {
    constructor(private deno: DenoEnv){}

    get(key: string, def: string): Either<string,string> {
        if( this.deno.env.has(key) ){
            return E.Right(this.deno.env.get(key) as string);
        } else {
            return E.Left(def);
        }
    }   
}

export const EnvServiceLive: EnvService = new EnvServiceImpl(Deno);