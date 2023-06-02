// deno-lint-ignore-file no-explicit-any
import * as R from 'https://deno.land/x/jazzi_net@v1.0.1/core/router.ts'

const appendHeader = (name: string, val: string) => (res: Response) => {
    res.headers.append(name, val)
    return res;
}

type CorsConfig = {
    origin: string,
    methods: string[],
    headers: string[]
}

const defaultConfig: CorsConfig = {
    origin: "*",
    methods: ["GET", "POST", "PUT"],
    headers: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Access-Control-Allow-Origin"]
}

const preflight = (
    path: string,
    config: CorsConfig = defaultConfig
) => R.options(path, (_, r) => r.respond("", { headers: {
    "Access-Control-Allow-Origin": config.origin,
    "Access-Control-Allow-Headers": config.headers.join(", "),
    "Access-Control-Allow-Methods": config.methods.join(", ")
}}))

export const policy = (path: string, _config: Partial<CorsConfig> = defaultConfig) => (router: R.RouterAsync) => {
    const config = { ...defaultConfig, ..._config}
    const pre = router['|>'](preflight(path, config))
    
    return config.methods.reduce((router, method) => {
        return router['|>'](R.useRoute(
            method as any, 
            path, 
            (_, r) => r.continueWith(appendHeader("Access-Control-Allow-Origin", config.origin)))
        )
    }, pre);
}