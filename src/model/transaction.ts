import * as S from "../support/schema.ts"

export interface Transaction {
    id: string,
    from: string,
    to: string,
    amount: number,
    createdAt: string
}

type ComputedAttrs = "createdAt" | "id"
export type CreateTransactionData = Omit<Transaction, ComputedAttrs>

export const CreateTransactionSchema = S.makeSchema<CreateTransactionData>({
    amount: S.numerical<number>()["&&"](S.minimun(1)),
    from: S.required(),
    to: S.required(),
})

export const validateCreateTransactionPayload = S.validateAsync(CreateTransactionSchema);