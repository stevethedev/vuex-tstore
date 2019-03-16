import { WatchOptions } from "vue";
import {
  ActionPayload,
  ActionTree,
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
  >,
  TWrappedActions = WrappedActions<
    TOptions extends { actions?: infer T } ? T : undefined
  >
> implements VuexStore<TRootState> {
  public get state(): TRootState {
    return this.store.state;
  }
  public readonly store: VuexStore<TRootState>;

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

  public commit: typeof VuexStore.prototype.commit & TWrappedMutations;

  public dispatch: typeof VuexStore.prototype.dispatch & TWrappedActions;
  private readonly name: Readonly<string>;

  /**
   * Instantiates a new wrapper.
   *
   * @param options The options to use when constructing the Vuex Store.
   * @param name The module name to use for this object.
   */
  constructor(options: TOptions & StoreOptions<TRootState>, name: string = "") {
    this.name = name;
    this.store = new VuexStore<TRootState>(options);

    // const dispatch = (
    //   type: string,
    //   payload?: any,
    //   options?: DispatchOptions
    // ) => {
    //   this.store.dispatch(type, payload, options);
    // };

    this.getters = wrapGetters(this.store, options.getters || {}, this.name);
    this.commit = wrapMutations(this.name, this.store, options.mutations || {});
    this.dispatch = wrapActions(this.name, this.store, options.actions || {});
  }

  public replaceState(state: TRootState): void {
    return this.store.replaceState(state);
  }

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
