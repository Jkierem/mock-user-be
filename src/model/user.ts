import * as S from "../support/schema.ts"

export interface User {
    id: string,
    name: string,
    username: string,
    password: string,
    balance: number
}

export const validateUserSchema = S.makeSchema<User>({
    id: S.anything(),
    name: S.required<string>()["&&"](S.between(3, 40)),
    password: S.required<string>()["&&"](S.between(7,30)),
    username: S.required<string>()["&&"](S.between(3,10)),
    balance: S.numerical<number>()["&&"](S.minimun(0))
})

export interface Credentials {
    username: string,
    password: string
}

export const validateCredentianlsSchema = S.makeSchema<Credentials>({
    username: S.required(),
    password: S.required()
})