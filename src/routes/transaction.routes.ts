import { Async } from 'https://deno.land/x/jazzi@v3.0.7/mod.ts'
import * as R from 'https://deno.land/x/jazzi_net@v1.0.2/core/router.ts'
import * as Cors from 'https://deno.land/x/jazzi_net@v1.0.2/core/cors.ts';
import { TransactionError, TransactionServiceLive } from '../services/transaction.service.ts'
import { BadRequest, ServerError, Success, getBody } from '../support/response.ts'
import { CreateTransactionData, Transaction, validateCreateTransactionPayload } from '../model/transaction.ts'
import { ValidationError } from '../support/schema.ts'

const createTx = Async.require<R.HandleInput>()
    .chain(({ request, results }) => {
        return getBody<CreateTransactionData>(request.raw)
            .chain(validateCreateTransactionPayload)
            .chain(data => TransactionServiceLive.create(data.result))
            .map(Success)
            .map(results.respondWith)
            .recover((e: ValidationError<Transaction> | TransactionError) => {
                if( e.kind === "validationError" ){
                    return Async.Success(results.respondWith(BadRequest({ message: e.reason })))
                } else if( e.kind === "insufficientFunds" ){
                    return Async.Success(results.respondWith(BadRequest({ message: "Insufficient funds for transaction" })))
                } else if( e.kind === "notFound" ){
                    return Async.Success(results.respondWith(BadRequest({ message: `Unknown user ${e.user}` })))
                } else {
                    return Async.Success(results.respondWith(ServerError({ message: e })))
                }
            })
    })

const getTxs = Async.require<R.HandleInput>()
    .chain(({ request, results }) => {
        return Async.Success(request.params.username)
            .chain(username => TransactionServiceLive.read(username))
            .map(Success)
            .map(results.respondWith)
            .recover((e) => {
                return Async.Success(results.respondWith(BadRequest({ message: e }))) 
            })
    })

export const registerTransactionRoutes = (router: R.RouterAsync) => {
    return router
        ['|>'](Cors.useAsync("POST", "/transactions", createTx))
        ['|>'](Cors.useAsync("GET" , "/transactions/:username", getTxs))
}