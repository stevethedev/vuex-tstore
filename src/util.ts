export type Result<F> = F extends (...args: any[]) => infer R ? R : any;
export type Partial<O> = { [key in keyof O]?: O[key] };

export type Payload<F> = F extends (store: any, payload: infer P) => any
  ? P
  : undefined;

export type PayloadReturn<F> = F extends (
  store: any,
  payload: Payload<F>
) => any
  ? ReturnType<F>
  : undefined;

/**
 * Retrieves the internal Vuex name for a function.
 *
 * @param fn The function to qualify.
 * @param namespace The namespace to qualify into.
 */
export const qualifyKey = (fn: (...args: any[]) => any, namespace?: string) => {
  const key = fn.name;
  return namespace ? `${namespace}/${key}` : key;
};
