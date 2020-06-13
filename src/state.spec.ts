import Vue from "vue";
import Vuex, { Store } from "vuex";
import { wrapState } from "./state";

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
    },
    optPayload: (
      context: TestState,
      { title, suffix = "foo" }: { title: string; suffix?: string }
    ) => {
      context.title = `${title} ${suffix || ""}`.replace(/^(.*)\s*$/, "$1");
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

test("wrapState can create a state proxy", () => {
  const options = testRootStoreOptions();
  const store = new Store(options);

  const state = wrapState("", store);

  expect(state.title).toBe("Hello, world!");
  const title = `${Date.now()}`;
  state.title = title;
  expect(state.title).toBe(title);
});

test("wrapState can access module states", () => {
  const options = testRootStoreOptions();
  const store = new Store(options);

  const state = wrapState("module", store);
  expect(state.value).toBe(0);

  const value = Math.random();
  state.value = value;
  expect(state.value).toBe(value);
});
