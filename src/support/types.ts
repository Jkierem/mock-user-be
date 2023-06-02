// deno-lint-ignore-file no-explicit-any
export type NestedValue<T, K> = K extends keyof T
  ? T[K]
  : K extends `${infer K0}.${infer K1}`
  ? K0 extends keyof T
    ? NestedValue<T[K0], K1>
    : never
  : never

export type NestedKey<T> = T extends Record<string, any>
  ? { 
    [K in keyof T]: T[K] extends Record<string, any> 
    ? `${string & K}` | `${string & K}.${string & NestedKey<T[K]>}` 
    : K
    }[keyof T]
  : never

export type NestedPartial<T> = {
  [K in keyof T]?: NestedPartial<T[K]>
}