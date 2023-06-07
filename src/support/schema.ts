// deno-lint-ignore-file no-explicit-any
import { Either } from "https://deno.land/x/jazzi@v3.0.7/Either/types.ts"
import { Either as E } from "https://deno.land/x/jazzi@v3.0.7/mod.ts"

export type Validator<T> = {
    kind: "validator",
    exec: (data: T) => Either<string, T>,
    ["&&"]: <U>(other: Validator<U>) => Validator<T | U>
}

export type SchemaDefinition<T> = {
    [K in keyof T]: Validator<T[K]> | SchemaDefinition<T[K]>
}

export type ValidationError<T> = { kind: "validationError", reason: T }
const makeError = <T>(reason: T): ValidationError<T> => ({ kind: "validationError", reason })
export type ValidationSuccess<T> = { kind: "validationSuccess", result: T }
const makeSuccess = <T>(result: T): ValidationSuccess<T> => ({ kind: "validationSuccess", result })

export type SchemaResult<T> = Either<ValidationError<{
    [K in keyof T]: T[K] extends Record<any,any> ? SchemaResult<T[K]> : string | undefined 
}>, ValidationSuccess<T>> 

export type Schema<T> = {
    kind: "schema",
    validate: (data: T) => SchemaResult<T>
}

export type SchemaValidation<T> = (data: T) => SchemaResult<T>

const entries = <T extends Record<any,any>>(rec: T) => Object.entries(rec) as unknown as [keyof T, T[keyof T]][];

export const makeSchema = <T>(schema: SchemaDefinition<T>): Schema<T> => ({
    kind: "schema",
    validate: (data: T) => {
        const results = entries(schema)
            .map(([key, val]) => {
                return [
                    key, 
                    "kind" in val 
                    ? val.exec(data[key]) 
                    : makeSchema(val as SchemaDefinition<T[keyof T]>)
                        .validate(data[key] as any)
                        .mapLeft(l => l.reason)
                ] as [string, Either<string, any>]
        });
        
        const hasError = results.some(([,x]) => x.isLeft());
        
        if( hasError ){
            return E.Left(Object.fromEntries(
                results
                    .filter(([, val]) => val.isLeft())
                    .map(([key, val]) => [key, val.getLeft()])
                )).mapLeft(makeError) as unknown as SchemaResult<T>
        } else {
            return E.Right(makeSuccess(data)) as SchemaResult<T>
        }
    }
})

export const fromFunction = <T>(exec: (data: T) => Either<string, T>): Validator<T> => ({ 
    kind: "validator",
    exec,
    ["&&"]<U>(other: Validator<U>){
        return fromFunction<T | U>((data) => exec(data as T).chain(() => other.exec(data as U)))
    }
})

export const required = <T>() => fromFunction<T>((x: T) => E.fromNullish("Missing data", x))

export const maxLength = (n: number) => fromFunction((x: string) => x.length <   n ? E.Right(x) : E.Left(`Maximun number of characters is ${n}`))

export const minLength = (n: number) => fromFunction((x: string) => x.length >=  n ? E.Right(x) : E.Left(`Minimun number of characters is ${n}`))

export const between = (min: number, max: number) => maxLength(max)["&&"](minLength(min));

export const anything = <T>() => fromFunction<T>((x) => E.Right<T>(x) as Either<string, T>);

export const numerical = <T>() => fromFunction<T>((x: T) => typeof x === "number" ? E.Right(x) : E.Left("Must be a number"))

export const minimun = (n: number) => fromFunction((x: number) => x >= n ? E.Right(x) : E.Left(`Must be larger or equal to ${n}`));

export const validateAsync = <T>(s: Schema<T>) => (data: T) => s.validate(data).toAsync();