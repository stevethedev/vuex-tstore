import { WatchOptions } from "vue";
import {
  ActionPayload,
  ActionTree,
  CommitOptions,
  DispatchOptions,
  GetterTree,
  Module,
  ModuleOptions,
  ModuleTree,
  MutationPayload,
  MutationTree,
  Store as VuexStore,
  StoreOptions,
  SubscribeActionOptions
} from "vuex";
import { wrapActions, WrappedActions } from "./actions";
import { GetAccessors, wrapGetters, WrappedGetters } from "./getters";
import { wrapMutations, WrappedMutations } from "./mutations";

interface Options {
  getters?: object;
  mutations?: object;
  actions?: object;
  modules?: object;
}

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
  TModuleState,
  TRootState,
  TOptions extends Options,
  TWrappedMutations = WrappedMutations<
    TOptions extends { mutations?: infer T } ? T : undefined
  >,
  TWrappedActions = WrappedActions<
    TOptions extends { actions?: infer T } ? T : undefined
  >,
  TWrappedGetters = WrappedGetters<
    GetAccessors<
      TModuleState,
      TRootState,
      TOptions extends { getters?: infer T } ? T : undefined
    >
  >,
  TModuleList = ModuleList<
    TModuleState,
    TRootState,
    TOptions extends { modules?: infer T } ? T : undefined
  >
> implements VuexStore<TRootState> {
  /**
   * Read-only property that holds the getters for this store.
   */
  public readonly getters: Readonly<TWrappedGetters>;

  public get state(): TRootState {
    return this.store.state;
  }

  public mutations: TWrappedMutations;

  public actions: TWrappedActions;

  public readonly modules: TModuleList;

  public readonly store: Readonly<VuexStore<TRootState>>;

  /**
   * Instantiates a new wrapper.
   *
   * @param options The options to use when constructing the Vuex Store.
   * @param name The module name to use for this object.
   */
  constructor(options: TOptions & StoreOptions<TRootState>);
  constructor(
    options: TOptions & StoreOptions<TRootState>,
    store: VuexStore<TRootState>,
    name: string
  );
  constructor(
    options: TOptions & StoreOptions<TRootState>,
    store = new VuexStore(options),
    name = ""
  ) {
    this.store = store;

    this.getters = wrapGetters(name, this.store, options.getters || {});
    this.mutations = wrapMutations(name, this, options.mutations || {});
    this.actions = wrapActions(name, this, options.actions || {});
    this.modules = wrapModules(name, this.store, options.modules || {});
  }

  public commit(type: string, payload?: any, options?: CommitOptions) {
    return this.store.commit(type, payload, options);
  }

  public async dispatch(
    type: string,
    payload?: any,
    options?: DispatchOptions
  ): Promise<any> {
    return this.store.dispatch(type, payload, options);
  }

  public registerModule<T>(
    path: string[] | string,
    module: Module<T, TRootState>,
    options?: ModuleOptions
  ): void {
    // This cast is just to pass the linter. Vuex wasn't built for TypeScript.
    return this.store.registerModule(path as string, module, options);
  }

  public unregisterModule(path: string | string[]): void {
    // This cast is just to pass the linter. Vuex wasn't built for TypeScript.
    return this.store.unregisterModule(path as string);
  }

  public hotUpdate(options: {
    actions?: ActionTree<TRootState, TRootState>;
    mutations?: MutationTree<TRootState>;
    getters?: GetterTree<TRootState, TRootState>;
    modules?: ModuleTree<TRootState>;
  }): void {
    return this.store.hotUpdate(options);
  }

  public replaceState(state: TRootState): void {
    return this.replaceState(state);
  }

  public subscribe<P extends MutationPayload>(
    fn: (mutation: P, state: TRootState) => any
  ): () => void {
    return this.store.subscribe(fn);
  }

  public subscribeAction<P extends ActionPayload>(
    fn: SubscribeActionOptions<P, TRootState>
  ): () => void {
    return this.store.subscribeAction(fn);
  }

  public watch<
    TGetterFn extends (state: TRootState, getters: TWrappedGetters) => any,
    TCbFn extends (
      value: ReturnType<TGetterFn>,
      oldValue: ReturnType<TGetterFn>
    ) => void
  >(getter: TGetterFn, cb: TCbFn, options?: WatchOptions): () => void {
    return this.store.watch(getter, cb, options);
  }
}

/**
 * Creates a dictionary of modules.
 *
 * @param parent The name of the parent module.
 * @param store The store to wrap.
 * @param modules The list of modules to process.
 */
function wrapModules<
  TModuleState,
  TRootState,
  TModules,
  TModuleList = ModuleList<TModuleState, TRootState, TModules>
>(
  parent: string,
  store: VuexStore<TRootState>,
  modules: TModules
): TModuleList {
  return Object.entries(modules).reduce((mods, [key, options]) => {
    const name = options.namespaced
      ? `${parent}${parent === "" ? "" : "/"}${key}`
      : "";
    return Object.defineProperty(mods, key, {
      value: new Store(options, store, name)
    });
  }, {}) as TModuleList;
}

type ModuleList<TModuleState, TRootState, TModules> = {
  [key in keyof TModules]: Store<TModuleState, TRootState, TModules[key]>
};
