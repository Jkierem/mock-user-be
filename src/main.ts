import * as S from 'https://deno.land/x/jazzi_net@v1.0.4/core/server.ts'
import * as R from 'https://deno.land/x/jazzi_net@v1.0.4/core/router.ts'
import * as C from 'https://deno.land/x/jazzi_net@v1.0.4/core/config.ts'
import { fold } from 'https://deno.land/x/jazzi@v4.1.0/Either/mod.ts'
import { getEnv } from "./services/env.service.ts"
import { registerUserRoutes } from './routes/user.routes.ts'
import { registerTransactionRoutes } from './routes/transaction.routes.ts'

const port = getEnv("PORT", "4000")['|>'](fold(Number, Number))

const router = R.makeRouter()
    ['|>'](R.useDebugRoute("*","%method %pathname"))
    ['|>'](registerUserRoutes)
    ['|>'](registerTransactionRoutes)

const config = C.makeConfig()
    ["|>"](C.withPort(port))
    ['|>'](C.withRouter(router))

S.makeServer()
['|>'](S.withConfig(config))
['|>'](S.listen())