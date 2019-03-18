# Vuex TypeScript Store

Vuex TStore is a low-overhead TypeScript wrapper around Vuex that can be used
to trigger compilation errors and IntelliSense tips in Visual Studio Code.

One of the problems with integrating Vuex with TypeScript is that it can be
difficult to track payload types in Vuex. This class generates type-aware
bindings to a wrapped Vuex store in order to expose typing information to the
store consumer via a series of Generics which reference the configuration
object. This means that this Store wrapper enables IntelliSense (VSCode),
Linters, and the TypeScript Compiler to be able to validate that code is
actually using the store correctly.

## How to install

Installation is fairly straightforward:

`npm install --save vuex-tstore`

## How to use

Setting up the Vuex TStore is slightly more involved than you may be used to.
In "vanilla" Vuex, type information will automatically propagate the `state`
and `context` types into the function. In Vuex TStore, you'll need to define
those types yourself:

```typescript
import Vue from "vue";
import TStore from "vuex-tstore";
import { ActionContext } from "vuex";

// Not completely necessary, but will bind the vue.$tstore element to the TStore
Vue.use(TStore);

type State = {
  title: string
};
type Context = ActionContext<State, State>;

// If you assign this to Vuex StoreOptions<State>, it will break your bindings.
const options = {
  state: (): State => ({ title: "Hello, world!" }),
  getters: {
    title: (state: State) => state.title
  },
  mutations: {
    resetTitle: (state: State) => { state.title = ''; },
    setTitle: (state: State, payload: { title: string }) => { state.title = title; }
  },
  actions: {
    resetTitle: async (context: Context) => context.commit('resetTitle'),
    setTitle: (context: Context, payload: { title: string }) => {
      setTimeout(() => context.commit('setTitle', payload), 1000);
    }
  }
};

const store = new TStore.Store(options);
```

However, once configured, the TStore will automatically deduct the parameter
and return types on getters, mutations, actions, and state objects.

```typescript
store.getters.title; // "Hello, world!"
store.mutations.resetTitle(); // ""
store.mutations.setTitle({ title: "foo" }); // "foo"
store.actions.resetTitle();
store.actions.setTitle({ title: "bar" });
```

## Store Structure

| Object            | Description                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `store.state`     | Provides a type-aware proxy to the Vuex State.                                                                                                                     |
| `store.getters`   | Provides a type-aware proxy to the Vuex Getters.                                                                                                                   |
| `store.mutations` | Contains a type-aware proxy to the Vuex Mutations. The TStore equivalent to `store.commit("mutate", payload)` is `store.mutations.mutate(payload)`.                |
| `store.actions`   | Contains a type-aware proxy to the Vuex Actions. The TStore equivalent to `store.dispatch("action", payload)` is `store.actions.action(payload)`.                  |
| `store.modules`   | Contains the registered modules on the Vuex Store. For example, a getter called `store.getters["foo/bar"]` would now live under `store.mutations.foo.getters.bar`. |

## Event Listeners

There are some new shorthand for registering event-handlers in this library.

### Mutation Listeners

```typescript
// call `unsub()` to remove the listener from the store.
const unsub = store.mutations.setTitle.listen(({ title }) => { alert(title); });
```

### Action Listeners

```typescript
const unsub_1 = store.actions.setTitle.before(({ title }) => console.log(`Updating title to ${title}`));
const unsub_2 = store.actions.setTitle.after(({ title }) => console.log(`Finished updating title to ${title}`));
```

