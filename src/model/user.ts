import * as S from "../support/schema.ts"

export interface User {
    id: string,
    name: string,
    username: string,
    password: string
}

export const validateUserSchema = S.makeSchema<User>({
    id: S.anything(),
    name: S.required(),
    password: S.required(),
    username: S.required()
})

export interface Credentials {
    username: string,
    password: string
}

export const validateCredentianlsSchema = S.makeSchema<Credentials>({
    username: S.required(),
    password: S.required()
})