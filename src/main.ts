import * as S from 'https://deno.land/x/jazzi_net@v1.0.1/core/server.ts'
import * as R from 'https://deno.land/x/jazzi_net@v1.0.1/core/router.ts'
import * as C from 'https://deno.land/x/jazzi_net@v1.0.1/core/config.ts'
import { getEnv } from "./services/env.service.ts"
import { registerUserRoutes } from './routes/user.ts'
import { registerTransactionRoutes } from './routes/transaction.ts'

const WithPort = C.withPort(Number(getEnv("PORT", "3000").unwrap()))

const router = R.makeRouter()
    ['|>'](R.useDebugRoute("*","%method %pathname"))
    ['|>'](registerUserRoutes)
    ['|>'](registerTransactionRoutes)

const config = C.makeConfig()
    ["|>"](WithPort)
    ['|>'](C.withRouter(router))

S.makeServer()
['|>'](S.withConfig(config))
['|>'](S.listen())