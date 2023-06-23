import * as hx from "../../support/html.ts"

export interface EndpointData {
    method: "GET" | "POST"
    path: string
    description: string
    params?: Record<string, string>
}

const methodCx = (method: "GET" | "POST") => {
    const m = "endpoint__head__element__method"
    return method === "GET" ? m : `${m} endpoint__head__element__method--${method.toLocaleLowerCase()}`
}

const Endpoint = ({
    method,
    path,
    description,
    params,
}: EndpointData) => {
    return hx.article({ class: "endpoint" })(
        hx.div({ class: "endpoint__head" })(
            hx.div({ class: "endpoint__head__element" })(
                hx.span({ class: methodCx(method) })(method)
            ),
            hx.div({ class: "endpoint__head__element" })(
                hx.span({ class: "endpoint__head__element__path"})(path)
            )
        ),
        hx.div({ class: "endpoint__body" })(
            hx.p()(description),
            !params ? "" : hx.div()(
                "URL params:",
                hx.ul()(
                    ...Object
                        .entries(params)
                        .map(([key, val]) => hx.li()(`:${key} ${val}`))
                )
            )
        ),
    )
}

export default Endpoint