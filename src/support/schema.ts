import { Either } from "https://deno.land/x/jazzi@v3.0.4/Either/types.ts"
import { Either as E } from "https://deno.land/x/jazzi@v3.0.4/mod.ts"

export type Validator<T> = {
    exec: (data: T) => Either<string, T>
}

export type Schema<T> = {
    [K in keyof T]: Validator<T[K]>
}

export type SchemaValidation<T> = (data: T) => Either<string[], T>

export const makeSchema = <T>(schema: Schema<T>): SchemaValidation<T> => {
    return (data) => {
        const results = Object
            .entries(schema)
            // deno-lint-ignore no-explicit-any
            .map(([key, val]) => (val as Validator<any>).exec(data?.[key as keyof T]))
        
        const hasError = results.some(x => x.isLeft());
        
        if( hasError ){
            return E.collectLefts(results)
        } else {
            return E.Right(data)
        }
    }
}

export const fromFunction = <T>(exec: (data: T) => Either<string, T>): Validator<T> => ({ exec })

export const required = <T>() => fromFunction<T>((x: T) => E.fromNullish("Missing data", x))

export const anything = <T>() => fromFunction<T>((x) => E.Right<T>(x) as Either<string, T>);