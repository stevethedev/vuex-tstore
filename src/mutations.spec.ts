import Vue from "vue";
import Vuex, { Store } from "vuex";
import { wrapMutations } from "./mutations";

// This prevents the test from throwing errors.
Vue.use(Vuex);

/*
 |-----------------------------------------------------------------------------
 | Test Bootstrapping
 |-----------------------------------------------------------------------------
 |
 | We need some types and data to test against. This section sets up the data
 | that the tests will be run against.
 |
 */
interface TestState {
  title: string;
}
interface TestModule {
  value: number;
}

const testRootStoreOptions = () => ({
  state: (): TestState => ({ title: "Hello, world!" }),
  mutations: {
    payload: (context: TestState, payload: { title: string }) => {
      context.title = payload.title;
    },
    noPayload: (context: TestState) => {
      context.title = "Hello, world!";
    }
  },
  modules: {
    module: testModuleStoreOptions()
  }
});

function testModuleStoreOptions() {
  return {
    namespaced: true,
    state: (): TestModule => ({ value: 0 }),
    mutations: {
      payload: (context: TestModule, payload: { value: number }) => {
        context.value = payload.value;
      },
      noPayload: (context: TestModule) => {
        context.value = 0;
      }
    }
  };
}

/*
 |-----------------------------------------------------------------------------
 | Tests
 |-----------------------------------------------------------------------------
 |
 | This section contains the tests that will be run.
 |
 */

test("wrapMutations can create an action proxy", () => {
  const options = testRootStoreOptions();
  const store = new Store<TestState>(options);

  const mutations = wrapMutations(() => void 0, store, options.mutations, "");

  const title = `${Date.now()}`;
  mutations.payload({ title });
  expect(store.state.title).toBe(title);

  mutations.noPayload();
  expect(store.state.title).toBe("Hello, world!");
});

test("wrapMutations can create module action proxies", () => {
  const options = testRootStoreOptions();
  const store = new Store<TestState>(options);

  const mutations = wrapMutations(
    () => void 0,
    store,
    options.modules.module.mutations,
    "module"
  );

  const value = Math.random();
  mutations.payload({ value });
  expect((store.state as any).module.value).toBe(value);

  mutations.noPayload();
  expect((store.state as any).module.value).toBe(0);
});
