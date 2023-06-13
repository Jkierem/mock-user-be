import * as E from "https://deno.land/x/jazzi@v4.1.0/Either/mod.ts"

export const getEnv = (str: string, def: string): E.Either<string, string> => {
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
    get(key: string, def: string): E.Either<string, string>
}

export class EnvServiceImpl implements EnvService {
    constructor(private deno: DenoEnv){}

    get(key: string, def: string): E.Either<string,string> {
        if( this.deno.env.has(key) ){
            return E.Right(this.deno.env.get(key) as string);
        } else {
            return E.Left(def);
        }
    }   
}

export const EnvServiceLive: EnvService = new EnvServiceImpl(Deno);