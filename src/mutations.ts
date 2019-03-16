/**
 * Defines how to manage the mutation proxies.
 */
import { Store } from "vuex";
import { qualifyKey } from "./util";

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
export declare type WrappedMutations<TMutations> = {
  [Key in keyof TMutations]: WrappedMutationHandler<TMutations[Key]> &
    MutationListener<TMutations[Key]>
};

export declare type WrappedMutationHandlers<TMutations> = {
  [Key in keyof TMutations]: WrappedMutationHandler<TMutations[Key]>
};

export declare type WrappedMutationHandler<TMutation> = TMutation extends (
  store: any
) => void
  ? WrappedMutationHandlerNoPayload
  : WrappedMutationHandlerWithPayload<TMutation>;

type WrappedMutationHandlerWithPayload<TMutation> = (
  payload: TMutation extends (store: any, payload: infer X) => void
    ? X
    : undefined
) => void;
type WrappedMutationHandlerNoPayload = () => void;

type MutationListenerWithPayload<TMutation> = {
  listen(handler: MutationListenerHandler<TMutation>): () => void;
};
type MutationListenerNoPayload = { listen(handler: () => void): () => void };

type MutationListener<TMutation> = TMutation extends (store: any) => void
  ? MutationListenerNoPayload
  : MutationListenerWithPayload<TMutation>;

export type MutationListenerHandler<TMutation> = (
  payload: TMutation extends (store: any, payload: infer X) => void
    ? X
    : undefined
) => void;

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
  onMutate: (
    mutation: keyof TWrappedMutations,
    handler: MutationListenerHandler<typeof mutation>
  ) => void,
  store: Store<TRootState>,
  mutations: TMutations,
  namespace: string
): TWrappedMutations {
  const result = {};
  for (const [key, mutation] of Object.entries(mutations)) {
    type TMutationHandler = WrappedMutationHandler<typeof mutation>;
    type TPartialAccessor = Partial<typeof mutation>;

    const deferred: TMutationHandler & TPartialAccessor = payload =>
      store.commit(qualifyKey(mutation, namespace), payload, {
        root: true
      });

    deferred.listen = (handler: MutationListenerHandler<typeof mutation>) =>
      onMutate(key as keyof TWrappedMutations, handler);

    Object.defineProperty(result, key, {
      get() {
        return deferred;
      }
    });
  }
  return result as TWrappedMutations;
}
