import { Async } from 'https://deno.land/x/jazzi@v3.0.4/mod.ts'
import * as R from 'https://deno.land/x/jazzi_net@v1.0.1/core/router.ts'
import { UserError, UserNotFound, UserServiceLive } from '../services/user.service.ts'
import { BadRequest, NotFound, ServerError, Success, Unauthorized, getBody } from '../support/response.ts';
import { Credentials, User, validateCredentianlsSchema, validateUserSchema } from '../model/user.ts';

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
                .chain(data => UserServiceLive.create(data))
                .map(user => results.respondWith(Success(user)))
                .recover((e: UserError) => {
                    if(e?.kind === "taken"){
                        return Async.Success(results.respondWith(BadRequest({ message: "Username taken" })));
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
                .chain(data => UserServiceLive.findByUsername(data.username).map(user => [data.password, user] as [string, User]))
                .chain(([a, user]) => {
                    if(user && a === user?.password){
                        return Async.Success(results.respondWith(Success({})))
                    } else {
                        return Async.Fail({})
                    }
                })
                .recover(() => {
                    return Async.Success(results.respondWith(Unauthorized({})))
                })
        } else {
            return Async.Success(results.respondWith(BadRequest({ message: "Incorrect body type" })))
        }
    })

export const registerUserRoutes = (router: R.RouterAsync) => {
    return router
        ['|>'](R.useAsync("GET" , "/users/:id", getUser))
        ['|>'](R.useAsync("POST", "/users"    , createUser))
        ['|>'](R.useAsync("POST", "/login"    , tryLogin))
}