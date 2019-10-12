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

test("wrapMutations can create a mutation proxy", () => {
  const options = testRootStoreOptions();
  const store = new Store(options);

  const mutations = wrapMutations("", store, options.mutations);

  const title = `${Date.now()}`;
  mutations.payload({ title });
  expect(store.state.title).toBe(title);

  mutations.noPayload();
  expect(store.state.title).toBe("Hello, world!");
});

test("wrapMutations can create module mutation proxies", () => {
  const options = testRootStoreOptions();
  const store = new Store(options);

  const mutations = wrapMutations(
    "module",
    store,
    options.modules.module.mutations
  );

  const value = Math.random();
  mutations.payload({ value });
  expect((store.state as any).module.value).toBe(value);

  mutations.noPayload();
  expect((store.state as any).module.value).toBe(0);
});

test("wrapMutations creates a after() function on mutations", () => {
  const options = testRootStoreOptions();
  const store = new Store(options);

  const mutations = wrapMutations("", store, options.mutations);

  let testMutation = null;

  mutations.payload.listen(({ title }) => (testMutation = title));
  store.commit({ type: "payload", title: "TEST" });
  expect(testMutation).toEqual("TEST");

  testMutation = null;
  store.commit("payload", { title: "TEST" });
  expect(testMutation).toEqual("TEST");

  testMutation = null;
  mutations.payload({ title: "TEST" });
  expect(testMutation).toEqual("TEST");

  mutations.noPayload.listen(() => (testMutation = true));

  testMutation = null;
  store.commit({ type: "noPayload" });
  expect(testMutation).toBe(true);

  testMutation = null;
  store.commit("noPayload");
  expect(testMutation).toBe(true);

  testMutation = null;
  mutations.noPayload();
  expect(testMutation).toBe(true);
});

test("wrapMutations creates a after() function on module mutations", () => {
  const options = testRootStoreOptions();
  const store = new Store(options);

  const mutations = wrapMutations("module", store, options.mutations);

  let testMutation = null;

  mutations.payload.listen(({ title }) => (testMutation = title));
  store.commit({ type: "module/payload", title: "TEST" });
  expect(testMutation).toEqual("TEST");

  testMutation = null;
  store.commit("module/payload", { title: "TEST" });
  expect(testMutation).toEqual("TEST");

  testMutation = null;
  mutations.payload({ title: "TEST" });
  expect(testMutation).toEqual("TEST");

  mutations.noPayload.listen(() => (testMutation = true));

  testMutation = null;
  store.commit({ type: "module/noPayload" });
  expect(testMutation).toBe(true);

  testMutation = null;
  store.commit("module/noPayload");
  expect(testMutation).toBe(true);

  testMutation = null;
  mutations.noPayload();
  expect(testMutation).toBe(true);
});

test("wrapMutations can handle optional parameters", () => {
  const options = testRootStoreOptions();
  const store = new Store(options);

  const mutations = wrapMutations("", store, options.mutations);

  mutations.optPayload({ title: "foo" });

  expect(store.state.title).toBe("foo foo");
});
