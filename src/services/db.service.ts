import { AsyncIO, AsyncUIO } from "https://deno.land/x/jazzi@v3.0.4/Async/types.ts"
import { Async } from "https://deno.land/x/jazzi@v3.0.4/mod.ts"
import { FileService, FileServiceLive } from "./file.service.ts"
import { EnvService, EnvServiceLive } from "./env.service.ts"
import { User } from "../model/user.ts"
import { Transaction } from "../model/transaction.ts"

export interface DB {
    users: Record<string, User>,
    transactions: Record<string, Transaction>
}

export interface DBService {
    read(): AsyncUIO<DB>,
    write(data: DB): AsyncUIO<void>,
    update<E>(fn: (data: DB) => AsyncIO<E,DB>): AsyncIO<E, void>
}

export class DBServiceImpl implements DBService {

    constructor(
        private file: FileService,
        private env: EnvService
    ){}

    private DBPath(){
        return this.env.get("DB_FILE", "./db.json").unwrap();
    }

    private connect(){
        const dbPath = this.DBPath();
        return this.file
            .exists(dbPath)
            .chain(exists => {
                if(exists){
                    return Async.Success(void 0)
                } else {
                    return this.file.write(
                        dbPath, 
                        JSON.stringify({ users: {}, transactions: {} }, null, 3)
                    )
                }
            })
            .zipRight(this.file.read(dbPath))
            .map(data => JSON.parse(data) as DB)
    }

    read(): AsyncUIO<DB> {
        return this.connect()
    }

    write(data: DB): AsyncUIO<void> {
        return this.file.write(this.DBPath(), JSON.stringify(data, null, 3));
    }

    update<E>(fn: (data: DB) => AsyncIO<E,DB>): AsyncIO<E, void> {
        return this.connect()
            .chain(fn)
            .chain(db => this.write(db))
    }
}

export const DBServiceLive: DBService = new DBServiceImpl(
    FileServiceLive,
    EnvServiceLive
)