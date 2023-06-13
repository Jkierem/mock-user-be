import * as A from "https://deno.land/x/jazzi@v4.1.0/Async/mod.ts"
import * as E from "https://deno.land/x/jazzi@v4.1.0/Either/mod.ts"
import { CreateUserData, User } from "../model/user.ts";
import { DB, DBService, DBServiceLive } from "./db.service.ts";
import { CryptoAdapter, CryptoAdapterLive } from "../adapters/crypto.adapter.ts";
import { Lens } from "../support/lens.ts";

export type UserNameTaken = { kind: "taken", username: string }
export type UserNotFound  = { kind: "notFound", user: string }
export type UserError = UserNameTaken | UserNotFound
const mkUserTaken = (username: string) => ({kind: "taken", username}) as UserError
const mkNotFound = (user: string) => ({kind: "notFound", user }) as UserError

export interface UserService {
    create(data: CreateUserData): A.AsyncIO<UserError, User>,
    read(id: string): A.AsyncIO<UserError, User>,
    findByUsername(username: string): A.AsyncIO<UserNotFound, User>,
    update(data: User): A.AsyncIO<UserError, User>,
    delete(id: string): A.AsyncIO<UserError, string>
}

export class UserServiceImpl implements UserService {
    constructor(
        private db: DBService,
        private crypto: CryptoAdapter
    ){}

    private usersLens = Lens.id<DB>().at("users");

    create(data: CreateUserData): A.AsyncIO<UserError, User> {

        return this.crypto.randomUUID()
            ['|>'](A.map(id => ({ ...data, id })))
            ['|>'](A.zip(this.db.read()))
            ["|>"](A.chain(([user, data]) => {
                const taken = Object
                        .values(this.usersLens.read(data) ?? {})
                        .find(u => u.username === user.username)
                    if(taken){
                        return A.Fail(mkUserTaken(user.username))
                    } else {
                        return A.Succeed([ user, data ] as [User, DB]);
                    }
            }))
            ['|>'](A.chain(([user, data]) => {
                data.users[user.id] = user;
                return this.db.write(data)['|>'](A.map(() => user))
            }))
    }

    read(id: string): A.AsyncIO<UserError,User> {
        const userLens = this.usersLens.at(id);
        const transactionsLens = Lens.id<DB>().at("transactions")
        return this.db
            .read()
            ['|>'](A.map(x => [userLens.read(x), transactionsLens.read(x)] as const))
            ['|>'](A.chain(([user, txs]) => {
                return E
                    .fromNullish(mkNotFound(id), user)
                    ['|>'](E.map((user) => {
                        const ts = Object.values(txs)
                        const adding = ts.filter(t => t.to === user.username).map(t => t.amount).reduce((a,b) => a+b,0)
                        const subtracting = ts.filter(t => t.from === user.username).map(t => t.amount).reduce((a,b) => a+b,0)
                        user.balance = user.balance + adding - subtracting;
                        return user;
                    }))
                    ['|>'](E.toAsync)
            }))
    }

    findByUsername(username: string) {
        return this.db
            .read()
            ['|>'](A.map(x => this.usersLens.read(x)))
            ['|>'](A.map(users => Object.values(users).find(u => u.username === username)))
            ['|>'](A.chain(user => E.fromNullish(mkNotFound(username), user)['|>'](E.toAsync)))
            ['|>'](A.chain(user => this.read(user.id)))
            ["|>"](A.mapError(x => x as UserNotFound))
    }

    update(data: User): A.AsyncIO<UserError,User> {
        const userLens = this.usersLens.at(data.id);
        const updateUser = userLens.toConstant(data)
        return this.db.update(db => {
            if( userLens.read(db) ){
                return A.Succeed(updateUser(db))
            }
            return A.Fail(mkNotFound(data.id));
        })['|>'](A.map(() => data));
    }

    delete(id: string): A.AsyncIO<UserError, string> {
        const userLens = this.usersLens.at(id);
        const removeUser = userLens.toConstant(undefined as unknown as User);
        return this.db.update(db => {
            if( userLens.read(db) ){
                return A.Succeed(removeUser(db))
            }
            return A.Fail(mkNotFound(id));
        })['|>'](A.map(() => id));
    }
}

export const UserServiceLive: UserService = new UserServiceImpl(
    DBServiceLive,
    CryptoAdapterLive
);