/**
 * Defines how to manage action proxies.
 */
import { Store as VuexStore } from "vuex";
import { Payload, PayloadReturn, qualifyKey } from "./util";

/**
 * Extracts an interface for wrapped action accessors.
 *
 * This somewhat beastly looking template is used to generate an interface for
 * a wrapper around a action object. That is, given an object where each
 * property is a function in the form `(store, payload?) => void`, a wrapper
 * could be made with matching properties where each property is in the form
 * `(payload?) => void`. In such an object, the `store` argument should be
 * automatically filled in with the store object being wrapped.
 *
 * Given an object of type `TActions` (below), this type reflects an interface
 * of type `TWrappedActions` (below).
 *
 * ```typescript
 * interface TActions {
 *   [key: string | number | Symbol]: (context: TContext, payload?: TPayload) => TResult
 * }
 *
 * type TWrappedActions = {
 *   [key in keyof TActions]: (payload?: TPayload) => TResult
 * }
 * ```
 */
export declare type WrappedActions<TActions> = {
  [Key in keyof TActions]: WrappedActionHandler<TActions[Key]> & {
    after(handler: ActionListenerHandler<TActions[Key]>): () => void;
    before(handler: ActionListenerHandler<TActions[Key]>): () => void;
  }
};

/**
 * Provides a generic interface for a wrapper around a `TAction` function.
 *
 * This automatically differentiates the actions that have payloads from the
 * actions that do not have payloads.
 */
type WrappedActionHandler<TAction> = TAction extends (store: any) => any
  ? () => ReturnType<TAction>
  : (payload: Payload<TAction>) => PayloadReturn<TAction>;

/**
 * Provides a generic interface for an action event-listener function.
 */
type ActionListenerHandler<TAction> = TAction extends (store: any) => any
  ? () => void
  : (payload: Payload<TAction>) => void;

/**
 * Wraps actions accessors to create a set of action proxies.
 *
 * This function *looks* arcane, but does exactly what it claims to do. It's
 * written this way because this yields precisely the desired results we want,
 * but without needing to fight TypeScript to do it.
 *
 * @param store The store to wrap action around.
 * @param actions The action accessors to wrap.
 *
 * ```typescript
 * import { Store } from 'vuex';
 * import { wrapActions } from 'vuex-tstore';
 *
 * const options = {
 *   actions: {
 *     async withFoo(store, payload: { foo: string }) {},
 *     async withoutFoo(store) {},
 *   },
 * };
 *
 * const store = new Store(options);
 * const actions = wrapActions(store, options.actions);
 *
 * actions.withFoo({ foo: 'foo' }); // Promise<void>
 * actions.withoutFoo();            // Promise<void>
 * ```
 */
export function wrapActions<
  TRootState,
  TActions extends object,
  TWrappedActions = WrappedActions<TActions>
>(
  namespace: string,
  store: VuexStore<TRootState>,
  actions: TActions
): TWrappedActions {
  return Object.entries(actions).reduce((dispatch, [key, action]) => {
    // Get the key that Vuex knows this action by.
    const actionKey = qualifyKey(action, namespace);

    // Prepare the function/listeners to give back to the store.
    type TActionHandler = WrappedActionHandler<typeof action> &
      Partial<typeof action>;
    const deferred: TActionHandler = payload =>
      store.dispatch(actionKey, payload, { root: true });

    deferred.before = (handler: ActionListenerHandler<typeof action>) =>
      store.subscribeAction({
        before: ({ type, payload }) => {
          if (type === actionKey) {
            (handler as any).call(null, payload);
          }
        }
      });
    deferred.after = (handler: ActionListenerHandler<typeof action>) =>
      store.subscribeAction({
        after: ({ type, payload }) => {
          if (type === actionKey) {
            (handler as any).call(null, payload);
          }
        }
      });

    // Attach the deferment to the dispatch function.
    return Object.defineProperty(dispatch, key, { value: deferred });
  }, {}) as TWrappedActions;
}
