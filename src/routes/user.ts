import { Async } from 'https://deno.land/x/jazzi@v3.0.4/mod.ts'
import * as R from 'https://deno.land/x/jazzi_net@v1.0.1/core/router.ts'
import { UserNameTaken, UserNotFound, UserServiceLive } from '../services/user.service.ts'
import { BadRequest, NotFound, ServerError, Success, Unauthorized, getBody } from '../support/response.ts';
import { Credentials, User, validateCredentianlsSchema, validateUserSchema } from '../model/user.ts';
import { ValidationError } from '../support/schema.ts';
import * as Cors from "../support/cors.ts";

const getUser = Async.require<R.HandleInput>()
    .chain(({ request, results }) => {
        const id = request.params.id;
        return UserServiceLive
            .read(id)
            .map(Success)
            .map(results.respondWith)
            .recover((e: UserNotFound) => {
                return Async.Success(results.respondWith(NotFound({ message: `User ${e.user} not found` })));
            })
    })

const createUser = Async.require<R.HandleInput>()
    .chain(({ request, results }) => {
        if(request.raw.headers.get("content-type")?.includes("application/json")){
            return getBody<Omit<User,"id">>(request.raw)
                .chain(data => validateUserSchema(data as User).toAsync())
                .map(data => data.result)
                .chain(data => UserServiceLive.create(data))
                .map(user => results.respondWith(Success(user)))
                .recover((e: UserNameTaken | ValidationError<User>) => {
                    if(e?.kind === "taken"){
                        return Async.Success(results.respondWith(BadRequest({ message: "Username taken" })));
                    } else if(e?.kind === "validationError") {
                        return Async.Success(results.respondWith(BadRequest({ message: e.reason })))
                    } else {
                        return Async.Success(results.respondWith(ServerError({ message: e })))
                    }
                })
        } else {
            return Async.Success(results.respondWith(BadRequest({ message: "Incorrect body type" })))
        }
    })

const tryLogin = Async.require<R.HandleInput>()
    .chain(({ request, results}) => {
        if(request.raw.headers.get("content-type")?.includes("application/json")){
            return getBody<Credentials>(request.raw)
                .chain(data => validateCredentianlsSchema(data).toAsync())
                .map(val => val.result)
                .chain(data => UserServiceLive.findByUsername(data.username).map(user => [data.password, user] as [string, User]))
                .chain(([a, user]) => {
                    if(user && a === user?.password){
                        const res = Success(user)
                        return Async.Success(results.respondWith(res))
                    } else {
                        return Async.Fail({})
                    }
                })
                .recover(() => {
                    return Async.Success(results.respondWith(Unauthorized({})))
                })
        } else {
            return Async.Success(results.respondWith(BadRequest({ message: "Incorrect content-type" })))
        }
    })

export const registerUserRoutes = (router: R.RouterAsync) => {
    return router
        ['|>'](Cors.useAsync("GET", "/user/:id", getUser))
        ['|>'](Cors.useAsync("POST", "/users"  , createUser))
        ['|>'](Cors.useAsync("POST", "/login"  , tryLogin))
}