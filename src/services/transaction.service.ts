import * as A from "https://deno.land/x/jazzi@v4.1.0/Async/mod.ts"
import { CreateTransactionData, Transaction } from "../model/transaction.ts";
import { UserNotFound, UserService, UserServiceLive } from "./user.service.ts";
import { DBService, DBServiceLive } from "./db.service.ts";
import { CryptoAdapter, CryptoAdapterLive } from "../adapters/crypto.adapter.ts";

export type InsufficientFunds = { kind: "insufficientFunds" }
const makeInsufficientFunds = (): InsufficientFunds => ({ kind: "insufficientFunds" })
export type TransactionError = UserNotFound | InsufficientFunds

export interface TransactionService {
    create(tx: CreateTransactionData): A.AsyncIO<TransactionError, Transaction>
    read(user: string): A.AsyncIO<UserNotFound, Transaction[]>
}

export class TransactionServiceImpl implements TransactionService {
    constructor(
        private users: UserService,
        private db: DBService,
        private crypto: CryptoAdapter
    ){}

    create({ from, to, amount }: CreateTransactionData): A.AsyncIO<TransactionError, Transaction> {
        const fromUser = this.users.findByUsername(from);
        const toUser = this.users.findByUsername(to);
        return fromUser
            ['|>'](A.zip(toUser))
            ['|>'](A.chain(([source]) => {
                if( source.balance >= amount ){
                    const transaction: CreateTransactionData = {
                        amount,
                        from,
                        to
                    }
                    return A.Succeed(transaction)
                } else {
                    return A.Fail(makeInsufficientFunds())
                }
            }))
            ['|>'](A.zip(this.crypto.randomUUID()))
            ['|>'](A.map(([partial, id]) => ({ ...partial, id, createdAt: Date.now().toString() })))
            ['|>'](A.chain((transaction) => {
                return this.db.update((db) => {
                    db.transactions[transaction.id] = transaction;
                    return A.Succeed(db); 
                })['|>'](A.map(() => transaction))
            })) as A.AsyncIO<TransactionError, Transaction>
    }

    read(user: string): A.AsyncIO<UserNotFound, Transaction[]> {
        return this.db
            .read()
            ['|>'](A.map(db => Object.values(db.transactions)))
            ['|>'](A.zip(this.users.findByUsername(user)))
            ['|>'](A.map(([txs, user]) => txs.filter(t => [t.from, t.to].includes(user.username))))
    }
}

export const TransactionServiceLive: TransactionService = new TransactionServiceImpl(
    UserServiceLive,
    DBServiceLive,
    CryptoAdapterLive
)