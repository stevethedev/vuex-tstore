export type Result<F> = F extends (...args: any[]) => infer R ? R : any;

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
