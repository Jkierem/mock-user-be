// deno-lint-ignore-file no-explicit-any
import { NestedValue } from "./types.ts"

export type AnyKey<T> = T extends Record<string, any>
  ? { [K in keyof T]: T[K] extends Record<string, any> ? K | `${string & K}.${AnyKey<T[K]>}` : K }[keyof T]
  : never

export type LensGet<S, A> = (s: S) => A
export type LensSet<S, A> = (s: S, a: A) => S

export function shallowSet<T, K extends keyof T>(attr: K): (s: T, a: T[K]) => T {
  return (s: T, a: T[K]) => ({ ...s, [attr]: a })
}

export function shallowGet<T, K extends keyof T>(attr: K): (s: T) => T[K] {
  return (s: T) => s?.[attr] as T[K]
}

export function safeShallowGet<T, K extends keyof T>(attr: K): (s: T) => T[K] | undefined {
  return (s: T) => s?.[attr]
}

export class Lens<S, A> {
  private constructor(private getter: LensGet<S, A>, private setter: LensSet<S, A>) {}

  static make<S, A>(getter: LensGet<S, A>, setter: LensSet<S, A>) {
    return new Lens(getter, setter)
  }

  static fromAttribute<T, K extends keyof T>(attr: K) {
    return new Lens<T, T[typeof attr]>(shallowGet(attr), shallowSet(attr))
  }

  public static fromDotNotation<S>(path: AnyKey<S> & string): Lens<S, NestedValue<S, typeof path>> {
    return path
      .split('.')
      .map((key) => Lens.make(safeShallowGet<any, any>(key), shallowSet(key)))
      .reduce((prev, next) => prev['>>>'](next as any)) as any
  }

  public static id<S>() {
    return Lens.make<S, S>(
      (x) => x,
      (x) => x,
    )
  }

  public read(s: S): A {
    return this.getter(s)
  }

  public update(fn: (a: A) => A): (s: S) => S {
    return (s: S) => this.setter(s, fn(this.getter(s)))
  }

  public toConstant(c: A): (s: S) => S {
    return this.update(() => c)
  }

  public combine<B>(other: Lens<A, B>): Lens<S, B> {
    return new Lens(
      (s: S) => other.getter(this.getter(s)),
      (s: S, b: B) => this.setter(s, other.setter(this.getter(s), b)),
    )
  }

  public ['>>>']<B>(other: Lens<A, B>): Lens<S, B> {
    return this.combine(other)
  }

  public at<K extends keyof A>(k: K): Lens<S, A[K]> {
    const next = Lens.make(safeShallowGet<A, K>(k) as any, shallowSet<A, K>(k))
    return this['>>>'](next)
  }
}
