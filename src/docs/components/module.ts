import * as hx from "../../support/html.ts"

export interface ModuleData {
    name: string
    endpoints: hx.JElement[]
}

const Module = ({ 
    name,
    endpoints
}: ModuleData) => {
    return hx.section()(
        hx.h2()(name),
        hx.section()(...endpoints)
    )
}

export default Module;