import { performance } from "perf_hooks";
import Vue from "vue";
import Vuex, { ActionContext, Store } from "vuex";
import { wrapActions } from "./actions";

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
type TestRootContext = ActionContext<TestState, TestState>;
type TestModuleContext = ActionContext<TestModule, TestState>;

interface TestState {
  title: string;
}
interface TestModule {
  value: number;
}

const testModuleStoreOptions = () => ({
  namespaced: true,
  state: (): TestModule => ({ value: 0 }),
  actions: {
    payload: async (context: TestModuleContext, payload: { value: number }) => {
      context.state.value = payload.value;
      return performance.now();
    },
    noPayload: async (context: TestModuleContext) => {
      context.state.value = 0;
      return performance.now();
    }
  }
});

const testRootStoreOptions = () => ({
  state: (): TestState => ({ title: "Hello, world!" }),
  actions: {
    payload: async (context: TestRootContext, payload: { title: string }) => {
      context.state.title = payload.title;
      return performance.now();
    },
    noPayload: async (context: TestRootContext) => {
      context.state.title = "Hello, world!";
      return performance.now();
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

test("wrapActions can create an action proxy", async () => {
  const options = testRootStoreOptions();
  const store = new Store<TestState>(options);

  const actions = wrapActions("", store, options.actions);

  const title = `${Date.now()}`;
  await actions.payload({ title });
  expect(store.state.title).toBe(title);

  await actions.noPayload();
  expect(store.state.title).toBe("Hello, world!");
});

test("wrapActions can create module action proxies", async () => {
  const options = testRootStoreOptions();
  const store = new Store<TestState>(options);

  const actions = wrapActions("module", store, options.modules.module.actions);

  const value = Math.random();
  actions.payload({ value });
  expect((store.state as any).module.value).toBe(value);

  await actions.noPayload();
  expect((store.state as any).module.value).toBe(0);
});

test("wrapActions creates an after() and before() function on root actions", async () => {
  const options = testRootStoreOptions();
  const store = new Store(options);

  const actions = wrapActions("", store, options.actions);

  let before = null;
  let when = null;
  let value = null;
  let after = null;

  actions.payload.before(_ => (before = performance.now()));
  actions.payload.before(({ title }) => (value = title));
  actions.payload.after(_ => (after = performance.now()));

  before = when = value = after = null;
  when = await actions.payload({ title: "TEST" });
  expect(value).toEqual("TEST");
  expect(before).toBeLessThan(when);
  expect(after).toBeGreaterThan(when);
});

test("wrapActions creates an after() and before() function on module actions", async () => {
  const options = testRootStoreOptions();
  const store = new Store(options);

  const actions = wrapActions("module", store, options.modules.module.actions);

  let before = null;
  let when = null;
  let value = null;
  let after = null;

  actions.payload.before(_ => (before = performance.now()));
  actions.payload.before(({ value: title }) => (value = title));
  actions.payload.after(_ => (after = performance.now()));

  before = when = value = after = null;
  when = await actions.payload({ value: 1 });
  expect(value).toEqual(1);
  expect(before).toBeLessThan(when);
  expect(after).toBeGreaterThan(when);
});
