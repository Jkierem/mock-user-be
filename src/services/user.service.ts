import { AsyncIO } from "https://deno.land/x/jazzi@v3.0.4/Async/types.ts";
import { Async, Either } from "https://deno.land/x/jazzi@v3.0.4/mod.ts";
import { User } from "../model/user.ts";
import { DB, DBService, DBServiceLive } from "./db.service.ts";
import { CryptoAdapter, CryptoAdapterLive } from "../adapters/crypto.adapter.ts";
import { Lens } from "../support/lens.ts";

export type UserNameTaken = { kind: "taken", username: string }
export type UserNotFound  = { kind: "notFound", user: string }
export type UserError = UserNameTaken | UserNotFound
const mkUserTaken = (username: string) => ({kind: "taken", username}) as UserError
const mkNotFound = (user: string) => ({kind: "notFound", user }) as UserError

export interface UserService {
    create(data: Omit<User, "id">): AsyncIO<UserError, User>,
    read(id: string): AsyncIO<UserError, User>,
    findByUsername(username: string): AsyncIO<UserNotFound, User>,
    update(data: User): AsyncIO<UserError, User>,
    delete(id: string): AsyncIO<UserError, string>
}

export class UserServiceImpl implements UserService {
    constructor(
        private db: DBService,
        private crypto: CryptoAdapter
    ){}

    private usersLens = Lens.id<DB>().at("users");

    create(data: Omit<User,"id">): AsyncIO<UserError, User> {
        return this.crypto
            .randomUUID()
            .map(id => ({ ...data, id }))
            .zip(this.db.read())
            .chain(([user, data]) => {
                const taken = Object
                    .values(this.usersLens.read(data) ?? {})
                    .find(u => u.username === user.username)
                if(taken){
                    return Async.Fail(mkUserTaken(user.username))
                } else {
                    return Async.Success([ user, data ] as [User, DB]);
                }
            })
            .chain(([ user, data ]) => {
                data.users[user.id] = user;
                return this.db
                    .write(data)
                    .mapTo(user)
            })
    }

    read(id: string): AsyncIO<UserError,User> {
        const userLens = this.usersLens.at(id);
        const transactionsLens = Lens.id<DB>().at("transactions")
        return this.db
            .read()
            .map(x => [userLens.read(x), transactionsLens.read(x)] as const)
            .chain(([user, txs]) => {
                return Either
                    .fromNullish(mkNotFound(id), user)
                    .map((user) => {
                        const ts = Object.values(txs)
                        const adding = ts.filter(t => t.to === user.username).map(t => t.amount).reduce((a,b) => a+b,0)
                        const subtracting = ts.filter(t => t.from === user.username).map(t => t.amount).reduce((a,b) => a+b,0)
                        user.balance = user.balance + adding - subtracting;
                        return user;
                    })
                    .toAsync()
            })
    }

    findByUsername(username: string): AsyncIO<UserError,User> {
        return this.db
            .read()
            .map(x => this.usersLens.read(x))
            .map(users => Object.values(users).find(u => u.username === username))
            .chain(user => Either.fromNullish(mkNotFound(username), user).toAsync())
            .chain(user => this.read(user.id))
    }

    update(data: User): AsyncIO<UserError,User> {
        const userLens = this.usersLens.at(data.id);
        const updateUser = userLens.toConstant(data)
        return this.db.update(db => {
            if( userLens.read(db) ){
                return Async.Success<unknown, UserError, DB>(updateUser(db))
            }
            return Async.Fail<UserError, DB>(mkNotFound(data.id));
        }).mapTo(data);
    }

    delete(id: string): AsyncIO<UserError, string> {
        const userLens = this.usersLens.at(id);
        const removeUser = userLens.toConstant(undefined as unknown as User);
        return this.db.update(db => {
            if( userLens.read(db) ){
                return Async.Success<unknown, UserError, DB>(removeUser(db))
            }
            return Async.Fail<UserError, DB>(mkNotFound(id));
        }).mapTo(id);
    }
}

export const UserServiceLive: UserService = new UserServiceImpl(
    DBServiceLive,
    CryptoAdapterLive
);