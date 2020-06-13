import { Store as VuexStore } from "vuex";

/**
 * Extracts the state of a store from a State parameter in the store or module
 * constructor. If the state is a function, then it returns the return value of
 * that function. Otherwise, it returns the type of the `state` property.
 */
export type TState<T> = T extends (...arg: any[]) => infer R ? R : T;

/**
 * This function returns the "state" property of the given module. Note that
 * the returned state will not change if the "replaceState" method is run.
 *
 * @param namespace Defines the slash-delimited Vuex namespace to read states from.
 * @param store     Provides a direct link to the store to read modules from.
 *
 * @return The state for the given store location.
 */
export function wrapState<TRootState>(
  namespace: string,
  store: VuexStore<TRootState>
) {
  const namespacePath = namespace.split("/");
  return namespacePath[0]
    ? namespacePath.reduce(
        (mState: any, path: string) => mState[path],
        store.state
      )
    : store.state;
}
