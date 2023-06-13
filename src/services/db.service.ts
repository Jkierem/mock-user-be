import * as A from "https://deno.land/x/jazzi@v4.1.0/Async/mod.ts"
import * as E from "https://deno.land/x/jazzi@v4.1.0/Either/mod.ts"

import { FileService, FileServiceLive } from "./file.service.ts"
import { EnvService, EnvServiceLive } from "./env.service.ts"
import { User } from "../model/user.ts"
import { Transaction } from "../model/transaction.ts"

export interface DB {
    users: Record<string, User>,
    transactions: Record<string, Transaction>
}

export interface DBService {
    read(): A.AsyncUIO<DB>,
    write(data: DB): A.AsyncUIO<void>,
    update<E>(fn: (data: DB) => A.AsyncIO<E,DB>): A.AsyncIO<E, void>
}

export class DBServiceImpl implements DBService {

    constructor(
        private file: FileService,
        private env: EnvService
    ){}

    private DBPath(){
        return this.env.get("DB_FILE", "./db.json")['|>'](E.get);
    }

    private connect(){
        const dbPath = this.DBPath();
        return this.file.exists(dbPath)
            ['|>'](A.chain(exists => {
                if(exists){
                    return A.Succeed(void 0)
                } else {
                    return this.file.write(
                        dbPath, 
                        JSON.stringify({ users: {}, transactions: {} }, null, 3)
                    )
                }
            }))
            ['|>'](A.zipRight(this.file.read(dbPath)))
            ['|>'](A.map(data => JSON.parse(data) as DB))
    }

    read(): A.AsyncUIO<DB> {
        return this.connect()
    }

    write(data: DB): A.AsyncUIO<void> {
        return this.file.write(this.DBPath(), JSON.stringify(data, null, 3));
    }

    update<E>(fn: (data: DB) => A.AsyncIO<E,DB>): A.AsyncIO<E, void> {
        return this.connect()
            ['|>'](A.chain(fn))
            ['|>'](A.chain(db => this.write(db)))
    }
}

export const DBServiceLive: DBService = new DBServiceImpl(
    FileServiceLive,
    EnvServiceLive
)