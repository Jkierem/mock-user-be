import * as S from "../support/schema.ts"

export interface Transaction {
    id: string,
    from: string,
    to: string,
    amount: number,
    createdAt: string
}

export const validateTransaction = S.makeSchema<Transaction>({
    id: S.anything(),
    amount: S.numerical<number>()["&&"](S.minimun(1)),
    from: S.required(),
    to: S.required(),
    createdAt: S.anything()
})