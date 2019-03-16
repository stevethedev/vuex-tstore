/**
 * Defines how to manage the mutation proxies.
 */
import { CommitOptions, Store as VuexStore } from "vuex";
import { Payload, PayloadReturn, qualifyKey } from "./util";

type Commit<TRootState> = VuexStore<TRootState>["commit"];

/**
 * Extracts an interface for wrapped mutation accessors.
 *
 * This somewhat beastly looking template is used to generate an interface for
 * a wrapper around a mutation object. That is, given an object where each
 * property is a function in the form `(store, payload?) => void`, a wrapper
 * could be made with matching properties where each property is in the form
 * `(payload?) => void`. In such an object, the `store` argument should be
 * automatically filled in with the store object being wrapped.
 *
 * Given an object of type `TMutations` (below), this type reflects that there
 * exists an interface of type `TWrappedMutations` (below).
 *
 * ```typescript
 * interface TMutations {
 *   [key: string | number | Symbol]: (context: TContext, payload?: TPayload) => TResult
 * }
 *
 * type TWrappedMutations = {
 *   [key in keyof TMutations]: (payload?: TPayload) => TResult
 * }
 * ```
 */
export type WrappedMutations<TMutations> = {
  [Key in keyof TMutations]: WrappedMutationHandler<TMutations[Key]> & {
    listen(handler: MutationListenerHandler<TMutations[Key]>): () => void;
  }
};

/**
 * Provides a generic interface for a wrapper around a `TMutation` function.
 *
 * This automatically differentiates the mutations that have payloads from the
 * mutations that do not have payloads.
 */
type WrappedMutationHandler<TMutation> = TMutation extends (store: any) => void
  ? () => ReturnType<TMutation>
  : (payload: Payload<TMutation>) => PayloadReturn<TMutation>;

/**
 * Provides a generic interface for a mutation event-listener function.
 */
type MutationListenerHandler<TMutation> = TMutation extends (store: any) => void
  ? () => void
  : (payload: Payload<TMutation>) => void;

/**
 * Wraps mutation accessors to create a set of mutation proxies.
 *
 * Yet another function that bypasses the type system for convenience. This
 * function does what it claims to do, but has to tell TypeScript to trust that
 * we know what we are doing. As always, change this function with caution,
 * because if this function breaks then we lose IntelliSense around mutations.
 *
 * @param onMutate The mutation function from the store.
 * @param accessors The accessor functions.
 * @param store The store to wrap mutations around.
 * @param mutations The mutation accessors to wrap.
 */
export function wrapMutations<
  TRootState,
  TMutations extends object,
  TWrappedMutations = WrappedMutations<TMutations>
>(
  namespace: string,
  store: VuexStore<TRootState>,
  mutations: TMutations
): Commit<TRootState> & TWrappedMutations {
  type PartialResult = Commit<TRootState> & Partial<TWrappedMutations>;

  return Object.entries(mutations).reduce(
    (commit, [key, mutation]) => {
      // Get the key that Vuex knows this mutation by.
      const mutationKey = qualifyKey(mutation, namespace);

      // Prepare the function/listeners to give back to the store.
      type TMutationHandler = WrappedMutationHandler<typeof mutation> &
        Partial<typeof mutation>;

      const deferred: TMutationHandler = payload =>
        commit(mutationKey, payload, { root: true });

      deferred.listen = (handler: MutationListenerHandler<typeof mutation>) =>
        store.subscribe(({ type, payload }) => {
          if (type === mutationKey) {
            (handler as any).call(null, payload);
          }
        });

      // Attach the deferment to the commit function.
      return Object.defineProperty(commit, key, { value: deferred });
    },
    ((type: string, payload?: any, options?: CommitOptions) =>
      store.commit(type, payload, options)) as PartialResult
  ) as Commit<TRootState> & TWrappedMutations;
}
