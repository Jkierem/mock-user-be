import { AsyncIO } from "https://deno.land/x/jazzi@v3.0.7/Async/types.ts";
import { Async } from "https://deno.land/x/jazzi@v3.0.7/mod.ts";
import { CreateTransactionData, Transaction } from "../model/transaction.ts";
import { UserNotFound, UserService, UserServiceLive } from "./user.service.ts";
import { DBService, DBServiceLive } from "./db.service.ts";
import { CryptoAdapter, CryptoAdapterLive } from "../adapters/crypto.adapter.ts";

export type InsufficientFunds = { kind: "insufficientFunds" }
const makeInsufficientFunds = (): InsufficientFunds => ({ kind: "insufficientFunds" })
export type TransactionError = UserNotFound | InsufficientFunds

export interface TransactionService {
    create(tx: CreateTransactionData): AsyncIO<TransactionError, Transaction>
    read(user: string): AsyncIO<UserNotFound, Transaction[]>
}

export class TransactionServiceImpl implements TransactionService {
    constructor(
        private users: UserService,
        private db: DBService,
        private crypto: CryptoAdapter
    ){}

    create({ from, to, amount }: CreateTransactionData): AsyncIO<TransactionError, Transaction> {
        const fromUser = this.users.findByUsername(from);
        const toUser = this.users.findByUsername(to);
        return fromUser
            .zip(toUser)
            .chain(([source]) => {
                if( source.balance >= amount ){
                    const transaction: CreateTransactionData = {
                        amount,
                        from,
                        to
                    }
                    return Async.Success(transaction)
                } else {
                    return Async.Fail(makeInsufficientFunds())
                }
            })
            .zip(this.crypto.randomUUID())
            .map(([partial, id]) => ({ ...partial, id, createdAt: Date.now().toString() }))
            .chain((transaction) => {
                return this.db.update((db) => {
                    db.transactions[transaction.id] = transaction;
                    return Async.Success(db); 
                }).mapTo(transaction)
            }) as AsyncIO<TransactionError, Transaction>
    }

    read(user: string): AsyncIO<UserNotFound, Transaction[]> {
        return this.db
            .read()
            .map(db => Object.values(db.transactions))
            .zip(this.users.findByUsername(user))
            .map(([txs, user]) => txs.filter(t => [t.from, t.to].includes(user.username)))
    }
}

export const TransactionServiceLive: TransactionService = new TransactionServiceImpl(
    UserServiceLive,
    DBServiceLive,
    CryptoAdapterLive
)