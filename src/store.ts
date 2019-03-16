import {
  Store as VuexStore,
  MutationPayload,
  SubscribeActionOptions,
  ModuleOptions,
  GetterTree,
  StoreOptions,
  Module,
  ActionPayload,
  CommitOptions,
  ModuleTree,
  MutationTree,
  ActionTree,
  Payload,
  DispatchOptions
} from "vuex";
import { WatchOptions } from "vue";
import { wrapGetters, GetAccessors, WrappedGetters } from "getters";
import {
  wrapMutations,
  WrappedMutationHandlers,
  WrappedMutations,
  MutationListenerHandler
} from "mutations";

/**
 * Creates a type-aware wrapper around a Vuex store.
 *
 * This class generates type-aware bindings to a wrapped Vuex store in order to
 * expose typing information to the store consumer via a series of Generics
 * which reference the configuration object. This means that this Store wrapper
 * enables IntelliSense (VSCode), Linters, and the TypeScript Compiler to be
 * able to validate that code is actually using the store correctly.
 */
export class Store<
  TModuleState extends object,
  TRootState extends object,
  TOptions extends object,
  TWrappedMutations = WrappedMutations<
    TOptions extends { mutations?: infer T } ? T : undefined
  >
> implements VuexStore<TRootState> {
  public readonly store: VuexStore<TRootState>;
  private readonly name: Readonly<string>;

  public get state(): TRootState {
    return this.store.state;
  }

  /**
   * Read-only property that holds the getters for this store.
   */
  public readonly getters: WrappedGetters<
    GetAccessors<
      TModuleState,
      TRootState,
      TOptions extends { getters?: infer T } ? T : undefined
    >
  >;

  /**
   * Instantiates a new wrapper.
   *
   * @param options The options to use when constructing the Vuex Store.
   * @param name The module name to use for this object.
   */
  constructor(options: TOptions & StoreOptions<TRootState>, name: string = "") {
    this.name = name;
    this.store = new VuexStore<TRootState>(options);

    const dispatch = (
      type: string,
      payload?: any,
      options?: DispatchOptions
    ) => {
      this.store.dispatch(type, payload, options);
    };

    this.getters = wrapGetters(this.store, options.getters || {}, name);
    this.commit = Object.assign(
      (type: string, payload?: any, options?: CommitOptions): void => {
        return this.store.commit(type, payload, options);
      },
      wrapMutations(
        (mutation: keyof TWrappedMutations, handler) =>
          this.onMutate(mutation, handler),
        this.store,
        options.mutations || {},
        name
      )
    );
  }

  public replaceState(state: TRootState): void {
    return this.store.replaceState(state);
  }

  // public readonly dispatch: ((
  //   type: string,
  //   payload?: any,
  //   options?: DispatchOptions
  // ) => Promise<any>) &
  //   (<P extends Payload>(
  //     payloadWithType: P,
  //     options?: DispatchOptions
  //   ) => Promise<any>);
  public dispatch(
    type: string,
    payload?: any,
    options?: DispatchOptions
  ): Promise<any> {
    return this.store.dispatch(type, payload, options);
  }

  public commit: typeof VuexStore.prototype.commit & TWrappedMutations;
  // public commit(type: string, payload: any, options?: CommitOptions): void {
  //   return this.store.commit(type, payload, options);
  // }

  public subscribe<P extends MutationPayload>(
    fn: (mutation: P, state: TRootState) => any
  ): () => void {
    return this.subscribe(fn);
  }
  public subscribeAction<P extends ActionPayload>(
    fn: SubscribeActionOptions<P, TRootState>
  ): () => void {
    return this.store.subscribeAction(fn);
  }
  public watch<T>(
    getter: (state: TRootState, getters: any) => T,
    cb: (value: T, oldValue: T) => void,
    options?: WatchOptions
  ): () => void {
    return this.store.watch(getter, cb, options);
  }

  /**
   * Adds a synchronous listener to execute after completing a mutation.
   *
   * @param mutation The name of the mutation to listen for.
   * @param handler The handler to execute after the mutation completes.
   *
   * @returns A function that may be executed to unsubscribe the listener.
   */
  public onMutate(
    mutation: keyof TWrappedMutations,
    handler: MutationListenerHandler<typeof mutation>
  ): () => void {
    const mutationKey = `${this.name}${
      this.name ? "/" : ""
    }${mutation as string}`;

    return this.store.subscribe(({ type, payload }) => {
      if (type === mutationKey) {
        (handler as any).call(this, payload);
      }
    });
  }

  public registerModule<T>(
    path: string,
    module: Module<T, TRootState>,
    options?: ModuleOptions
  ): void;
  public registerModule<T>(
    path: string[],
    module: Module<T, TRootState>,
    options?: ModuleOptions
  ): void;
  public registerModule<T>(
    path: string[] | string,
    module: Module<T, TRootState>,
    options?: ModuleOptions
  ): void {
    if (Array.isArray(path)) {
      return this.store.registerModule(path, module, options);
    }
    return this.store.registerModule(path, module, options);
  }

  public unregisterModule(path: string[]): void;
  public unregisterModule(path: string): void;
  public unregisterModule(path: string | string[]): void {
    if (Array.isArray(path)) {
      return this.store.unregisterModule(path);
    }
    return this.store.unregisterModule(path);
  }

  public hotUpdate(options: {
    actions?: ActionTree<TRootState, TRootState>;
    mutations?: MutationTree<TRootState>;
    getters?: GetterTree<TRootState, TRootState>;
    modules?: ModuleTree<TRootState>;
  }): void {
    return this.store.hotUpdate(options);
  }
}
