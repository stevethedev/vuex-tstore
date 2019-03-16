import Vue from "vue";
import Vuex, { Store } from "vuex";
import { wrapGetters } from "./getters";

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

const testModuleStoreOptions = () => ({
  namespaced: true,
  state: (): TestModule => ({ value: 0 }),
  getters: {
    value: (state: TestModule) => state.value,
    update: (state: TestModule) => (val: number) => {
      state.value = val;
      return state.value;
    }
  }
});

const testRootStoreOptions = () => ({
  state: (): TestState => ({ title: "Hello, world!" }),
  getters: {
    title: (state: TestState) => state.title,
    update: (state: TestState) => (val: string) => {
      state.title = val;
      return state.title;
    }
  },
  modules: {
    module: testModuleStoreOptions()
  }
});

/*
 |-----------------------------------------------------------------------------
 | Tests
 |-----------------------------------------------------------------------------
 |
 | This section contains the tests that will be run.
 |
 */

test("wrapGetters can create a getter proxy", () => {
  const options = testRootStoreOptions();
  const store = new Store<TestState>(options);

  const getters = wrapGetters("", store, options.getters);

  expect(getters.title).toBe(store.state.title);
  expect(getters.title).toBe(store.getters.title);

  const title = `${Date.now()}`;
  expect(getters.update(title)).toBe(title);
});

test("wrapGetters can create module getter proxies", () => {
  const options = testRootStoreOptions();
  const store = new Store<TestState>(options);

  const getters = wrapGetters("module", store, options.modules.module.getters);

  expect(getters.value).toBe((store.state as any).module.value);
  expect(getters.value).toBe(store.getters["module/value"]);

  const value = Math.random();
  expect(getters.update(value)).toBe(value);
});
