import { Store as VuexStore } from "vuex";

export type TState<T> = T extends (...arg: any[]) => infer R ? R : T;

export function wrapState<TRootState>(
  namespace: string,
  store: VuexStore<TRootState>,
) {
  const namespacePath = namespace.split('/');
  return namespacePath[0]
    ? namespacePath.reduce((mState: any, path: string) => mState[path], store.state)
    : store.state;
}
