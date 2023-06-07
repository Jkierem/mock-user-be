import * as S from "../support/schema.ts"

export interface User {
    id: string,
    name: string,
    username: string,
    password: string,
    balance: number
}

export type CreateUserData = Omit<User, "id">;

export const CreateUserSchema = S.makeSchema<CreateUserData>({
    name: S.required<string>()["&&"](S.between(3, 40)),
    password: S.required<string>()["&&"](S.between(7,30)),
    username: S.required<string>()["&&"](S.between(3,10)),
    balance: S.numerical<number>()["&&"](S.minimun(0))
})

export const validateCreateUserPayload = S.validateAsync(CreateUserSchema)

export interface Credentials {
    username: string,
    password: string
}

export const CredentialsSchema = S.makeSchema<Credentials>({
    username: S.required(),
    password: S.required()
})

export const validateCredentianlsPayload = S.validateAsync(CredentialsSchema);