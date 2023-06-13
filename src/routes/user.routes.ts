import * as A from "https://deno.land/x/jazzi@v4.0.0/Async/mod.ts"
import * as R from 'https://deno.land/x/jazzi_net@v1.0.3/core/router.ts'
import * as Cors from 'https://deno.land/x/jazzi_net@v1.0.3/core/cors.ts';
import { UserError, UserServiceLive } from '../services/user.service.ts'
import { BadRequest, NotFound, ServerError, Success, Unauthorized, getBody } from '../support/response.ts';
import { Credentials, User, validateCreateUserPayload, validateCredentianlsPayload } from '../model/user.ts';

const getUser = A.require<R.HandleInput>()
    ['|>'](A.chain(({ request, results }) => {
        const id = request.params.id;
        return UserServiceLive.read(id)
            ['|>'](A.map(Success))
            ['|>'](A.map(results.respondWith))
            ['|>'](A.recover((e: UserError) => {
                if( e.kind === "notFound"){
                    return A.Succeed(results.respondWith(NotFound({ message: `User ${e.user} not found` })));
                }
                return A.Succeed(results.respondWith(ServerError(e)))
            }))
    }))

const createUser = A.require<R.HandleInput>()
    ['|>'](A.chain(({ request, results }) => {
        if(request.raw.headers.get("content-type")?.includes("application/json")){
            return getBody<Omit<User,"id">>(request.raw)
                ['|>'](A.chain(validateCreateUserPayload))
                ['|>'](A.map(data => data.result))
                ['|>'](A.chain(data => UserServiceLive.create(data)))
                ['|>'](A.map(user => results.respondWith(Success(user))))
                ['|>'](A.recover((e) => {
                    if(e?.kind === "taken"){
                        return A.Succeed(results.respondWith(BadRequest({ message: "Username taken" })));
                    } else if(e?.kind === "validationError") {
                        return A.Succeed(results.respondWith(BadRequest({ message: e.reason })))
                    } else {
                        return A.Succeed(results.respondWith(ServerError({ message: e })))
                    }
                }))
        } else {
            return A.Succeed(results.respondWith(BadRequest({ message: "Incorrect body type" })))
        }
    }))

const tryLogin = A.require<R.HandleInput>()
    ['|>'](A.chain(({ request, results}) => {
        if(request.raw.headers.get("content-type")?.includes("application/json")){
            return getBody<Credentials>(request.raw)
                ['|>'](A.chain(validateCredentianlsPayload))
                ['|>'](A.map(val => val.result))
                ['|>'](A.chain(data => UserServiceLive.findByUsername(data.username)['|>'](A.map(user => [data.password, user] as [string, User]))))
                ['|>'](A.chain(([a, user]) => {
                    if(user && a === user?.password){
                        const res = Success(user)
                        return A.Succeed(results.respondWith(res))
                    } else {
                        return A.Fail({})
                    }
                }))
                ["|>"](A.recover(() => {
                    return A.Succeed(results.respondWith(Unauthorized({})))
                }))
        } else {
            return A.Succeed(results.respondWith(BadRequest({ message: "Incorrect content-type" })))
        }
    }))

export const registerUserRoutes = (router: R.RouterAsync) => {
    return router
        ['|>'](Cors.useAsync("GET", "/user/:id", getUser))
        ['|>'](Cors.useAsync("POST", "/users"  , createUser))
        ['|>'](Cors.useAsync("POST", "/login"  , tryLogin))
}