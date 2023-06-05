import { Async } from "https://deno.land/x/jazzi@v3.0.7/mod.ts"

export const makeJsonResponse = (status: number) => <T>(body: T) => new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    status,
})

export const Success = makeJsonResponse(200)
export const BadRequest = makeJsonResponse(400)
export const Unauthorized = makeJsonResponse(401)
export const NotFound = makeJsonResponse(404)
export const ServerError = makeJsonResponse(500)

export const getBody = <A>(res: Request) => Async.from(() => res.json() as Promise<A>)