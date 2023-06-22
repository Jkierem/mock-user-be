import * as A from "https://deno.land/x/jazzi@v4.1.0/Async/mod.ts"
import * as R from 'https://deno.land/x/jazzi_net@v1.0.4/core/router.ts'
import { DocsServiceLive } from "../services/docs.service.ts"
import { ServerError } from "../support/response.ts"

const showDocs = A.require<R.HandleInput>()
    ["|>"](A.chain(({ results }) => {
        return DocsServiceLive.get()
            ['|>'](A.map(html => new Response(html, {
                headers: {
                    "Content-type": "text/html"
                }
            })))
            ['|>'](A.map(results.respondWith))
            ["|>"](A.recover((e) => {
                console.error(e)
                return A.Succeed(results.respondWith(ServerError({ message: e })))
            }))
    }))

export const registerDocsRoutes = (router: R.RouterAsync) => {
    return router
        ["|>"](R.useAsync("GET", "/docs", showDocs))
}