// deno-lint-ignore-file no-explicit-any
import * as R from 'https://deno.land/x/jazzi_net@v1.0.1/core/router.ts'

const appendHeader = (name: string, val: string) => (res: Response) => {
    res.headers.append(name, val)
    return res;
}

type Method =  "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH"

type CorsConfig = {
    origin: string,
    methods: Method[],
    headers?: string[],
}

const defaultConfig: CorsConfig = {
    origin: "*",
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
}

const preflight = (
    path: string,
    _config: Partial<CorsConfig> = defaultConfig
) => R.options(path, (req, r) => {
    const { raw } = req

    const config = {
        ...defaultConfig,
        ..._config,
        headers: _config.headers ?? raw.headers.get("Access-Control-Request-Headers")?.split(","),
    }

    const headers: Record<string, string> = {
        "Access-Control-Allow-Origin": config.origin,
        "Access-Control-Allow-Methods": config.methods.join(", ")
    }

    if( config.headers ){
        headers[ "Access-Control-Allow-Headers"] = config.headers.join(",")
    }


    return r.respond("", { headers });
})

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

/**
 * Single route, single method CORS policy for a async handler
 */
export const useAsync = (
    method: Method, 
    path: string, 
    handle: R.AsyncHandle,
    _config: Omit<Partial<CorsConfig>, "methods"> = defaultConfig
) => (router: R.RouterAsync) => {
    const config: CorsConfig = { 
        ...defaultConfig, 
        ..._config,
        methods: [method]
    };
    return router
        ['|>'](policy(path, config))
        ['|>'](R.useAsync(method, path, handle))
}