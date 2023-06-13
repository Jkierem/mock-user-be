import * as A from "https://deno.land/x/jazzi@v4.0.0/Async/mod.ts"
import * as R from 'https://deno.land/x/jazzi_net@v1.0.3/core/router.ts'
import * as Cors from 'https://deno.land/x/jazzi_net@v1.0.3/core/cors.ts';
import { TransactionServiceLive } from '../services/transaction.service.ts'
import { BadRequest, ServerError, Success, getBody } from '../support/response.ts'
import { CreateTransactionData, validateCreateTransactionPayload } from '../model/transaction.ts'

const createTx = A.require<R.HandleInput>()
    ['|>'](A.chain(({ request, results }) => {
        return getBody<CreateTransactionData>(request.raw)
            ['|>'](A.chain(validateCreateTransactionPayload))
            ['|>'](A.chain(data => TransactionServiceLive.create(data.result)))
            ['|>'](A.map(Success))
            ['|>'](A.map(results.respondWith))
            ['|>'](A.recover((e) => {
                if( e.kind === "validationError" ){
                    return A.Succeed(results.respondWith(BadRequest({ message: e.reason })))
                } else if( e.kind === "insufficientFunds" ){
                    return A.Succeed(results.respondWith(BadRequest({ message: "Insufficient funds for transaction" })))
                } else if( e.kind === "notFound" ){
                    return A.Succeed(results.respondWith(BadRequest({ message: `Unknown user ${e.user}` })))
                } else {
                    return A.Succeed(results.respondWith(ServerError({ message: e })))
                }
            }))
    }))

const getTxs = A.require<R.HandleInput>()
    ['|>'](A.chain(({ request, results }) => {
        return A.Succeed(request.params.username)
            ['|>'](A.chain(username => TransactionServiceLive.read(username)))
            ['|>'](A.map(Success))
            ['|>'](A.map(results.respondWith))
            ['|>'](A.recover((e) => {
                return A.Succeed(results.respondWith(BadRequest({ message: e }))) 
            }))
    }))

export const registerTransactionRoutes = (router: R.RouterAsync) => {
    return router
        ['|>'](Cors.useAsync("POST", "/transactions", createTx))
        ['|>'](Cors.useAsync("GET" , "/transactions/:username", getTxs))
}