type JElementType = 
    | "section" | "div" | "article" | "span" 
    | "body" | "p" | "ul" | "li" | "h2"

export type JElement = {
    type: JElementType,
    props: Record<string, string>,
    children: (JElement | string)[]
}

const element = (type: JElementType) => (props: Record<string, string> = {}) => (...children: (JElement | string)[]) => ({
    type,
    props,
    children
})

export const section = element("section")
export const article = element("article")
export const body    = element("body")
export const div     = element("div")
export const span    = element("span")
export const p       = element("p")
export const ul      = element("ul")
export const li      = element("li")
export const h2      = element("h2")

const renderProps = (props: Record<string, string>) => {
    const stringify = (val: number | boolean | string) => {
        if( typeof val === "string" ){
            return `"${val}"`;
        } else {
            return val
        }
    }
    const str = Object
        .entries(props)
        .map(([key, value]) => [key, stringify(value)])
        .map(([key, value]) => `${key}=${value}`)
        .join(" ")
    return str.length > 0 ? ` ${str} ` : "";
}

export const render = ({ type, props, children }: JElement): string => {
    const opening = `<${type}${renderProps(props)}>`
    const closing = `</${type}>`
    const innerHtml = children.filter(Boolean).map(c => {
        if( typeof c === "string" ){
            return c;
        } else {
            return render(c)
        }
    }).join("")
    return `${opening}${innerHtml}${closing}`
} 