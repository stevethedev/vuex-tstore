import Vue from "vue";
import Vuex, { ActionContext } from "vuex";
import { Store } from "./store";

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
    mpayload: async (
      context: TestModuleContext,
      payload: { value: number }
    ) => {
      context.state.value = payload.value;
    },
    mnoPayload: async (context: TestModuleContext) => {
      context.state.value = 0;
    }
  },
  getters: {
    mvalue: (state: TestModule) => state.value,
    mupdate: (state: TestModule) => (val: number) => {
      state.value = val;
      return state.value;
    }
  },
  mutations: {
    mpayload: (context: TestModule, payload: { value: number }) => {
      context.value = payload.value;
    },
    mnoPayload: (context: TestModule) => {
      context.value = 0;
    }
  }
});

const testRootStoreOptions = () => ({
  state: (): TestState => ({ title: "Hello, world!" }),
  actions: {
    payload: async (context: TestRootContext, payload: { title: string }) => {
      context.state.title = payload.title;
      return true;
    },
    noPayload: async (context: TestRootContext) => {
      context.state.title = "Hello, world!";
      return true;
    }
  },
  getters: {
    title: (state: TestState) => state.title,
    update: (state: TestState) => (val: string) => {
      state.title = val;
      return state.title;
    }
  },
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

/*
 |-----------------------------------------------------------------------------
 | Tests
 |-----------------------------------------------------------------------------
 |
 | This section conducts holistic tests on the Store class.
 |
 */
test("Can create a Store", () => {
  const options = testRootStoreOptions();
  const wrapper = new Store(options);

  expect(wrapper).toBeInstanceOf(Store);
});

test("Can access store actions", async () => {
  const options = testRootStoreOptions();
  const wrapper = new Store(options);

  const title = `${Date.now()}`;
  await wrapper.actions.payload({ title });
  expect(wrapper.state.title).toBe(title);

  await wrapper.actions.noPayload();
  expect(wrapper.state.title).toBe("Hello, world!");
});

test("Can accept missing action config", () => {
  const options = testRootStoreOptions();
  delete options.actions;
  const wrapper = new Store(options);

  expect(wrapper.actions).toEqual({});
});

test("Can access store mutations", () => {
  const options = testRootStoreOptions();
  const store = new Store(options);

  const title = `${Date.now()}`;
  store.mutations.payload({ title });
  expect(store.state.title).toBe(title);

  store.mutations.noPayload();
  expect(store.state.title).toBe("Hello, world!");
});

test("Can accept missing mutation config", () => {
  const options = testRootStoreOptions();
  delete options.mutations;
  expect(new Store(options)).toBeTruthy();
});

test("Can access store getters", () => {
  const options = testRootStoreOptions();
  const wrapper = new Store(options);

  expect(wrapper.getters.title).toBe(wrapper.state.title);
  expect(wrapper.getters.title).toBe(wrapper.getters.title);

  const title = `${Date.now()}`;
  expect(wrapper.getters.update(title)).toBe(title);
});

test("Can accept missing getter config", () => {
  const wrapper = new Store({});

  expect(wrapper.getters).toEqual({});
});

test("Can access store modules", () => {
  const options = testRootStoreOptions();
  const wrapper = new Store(options);

  expect(wrapper.modules.module).toBeInstanceOf(Store);
});

test("Can access module actions", async () => {
  const options = testRootStoreOptions();
  const wrapper = new Store(options);

  const value = Math.random();
  wrapper.modules.module.actions.mpayload({ value });
  expect((wrapper.state as any).module.value).toBe(value);

  await wrapper.modules.module.actions.mnoPayload();
  expect((wrapper.state as any).module.value).toBe(0);
});

test("Can access module mutations", () => {
  const options = testRootStoreOptions();
  const wrapper = new Store(options);

  const value = Math.random();
  wrapper.modules.module.mutations.mpayload({ value });
  expect((wrapper.state as any).module.value).toBe(value);

  wrapper.modules.module.mutations.mnoPayload();
  expect((wrapper.state as any).module.value).toBe(0);
});

test("Can access module getters", () => {
  const options = testRootStoreOptions();
  const wrapper = new Store(options);
  expect(wrapper.modules.module.getters.mvalue).toBe(
    wrapper.store.getters["module/mvalue"]
  );
  expect(wrapper.modules.module.getters.mvalue).toBe(
    (wrapper.state as any).module.value
  );

  const value = Math.random();
  expect(wrapper.modules.module.getters.mupdate(value)).toBe(value);
});

test("Can access non-namespaced modules", () => {
  const options = testRootStoreOptions();
  options.modules.module.namespaced = false;
  const wrapper = new Store(options);

  expect(wrapper.modules.module).toBeInstanceOf(Store);
  expect(wrapper.modules.module.getters.mvalue).toBe(
    (wrapper.state as any).module.value
  );
  expect(wrapper.modules.module.getters.mvalue).toBe(
    wrapper.store.getters.mvalue
  );
});

test("Can create commit listeners on mutations", () => {
  const options = testRootStoreOptions();
  const wrapper = new Store(options);

  let onNoPayload = false;
  let onPayload: any = null;

  wrapper.mutations.noPayload.listen(() => {
    onNoPayload = true;
  });
  wrapper.mutations.payload.listen(fnPayload => {
    onPayload = fnPayload;
  });

  const payload = { title: "test" };

  wrapper.mutations.payload(payload);
  wrapper.mutations.noPayload();

  expect(onPayload).toBe(payload);
  expect(onNoPayload).toBe(true);
});

test("Can create before-action listeners on actions", async () => {
  const options = testRootStoreOptions();
  const wrapper = new Store(options);

  let onNoPayload = false;
  let onPayload: any = null;

  wrapper.actions.noPayload.before(() => {
    onNoPayload = true;
  });
  wrapper.actions.payload.before(fnPayload => {
    onPayload = fnPayload;
  });

  const payload = { title: "test" };

  wrapper.actions.payload(payload);
  wrapper.actions.noPayload();

  expect(onPayload).toBe(payload);
  expect(onNoPayload).toBe(true);
});

test("Can create before-action listeners on store", async () => {
  const options = testRootStoreOptions();
  const wrapper = new Store(options);

  let onNoPayload = false;
  let onPayload: any = null;

  const npPromise = wrapper.actions.noPayload.after(() => {
    onNoPayload = true;
  });
  const pPromise = wrapper.actions.payload.after(fnPayload => {
    onPayload = fnPayload;
  });

  const payload = { title: `${Date.now()}` };

  wrapper.actions.payload(payload);
  wrapper.actions.noPayload();

  expect(onPayload).toBe(null);
  expect(onNoPayload).toBe(false);

  await Promise.all([npPromise, pPromise]);

  expect(onPayload).toBe(payload);
  expect(onNoPayload).toBe(true);
});

test("Can create before-action listeners on module actions", async () => {
  const options = testRootStoreOptions();
  const wrapper = new Store(options);

  let onNoPayload = false;
  let onPayload: any = null;

  wrapper.modules.module.actions.mnoPayload.before(() => {
    onNoPayload = true;
  });
  wrapper.modules.module.actions.mpayload.before(fnPayload => {
    onPayload = fnPayload;
  });

  const payload = { value: Math.random() };

  wrapper.modules.module.actions.mpayload(payload);
  wrapper.modules.module.actions.mnoPayload();

  expect(onPayload).toBe(payload);
  expect(onNoPayload).toBe(true);
});

test("Can create after-action listeners on module actions", async () => {
  const options = testRootStoreOptions();
  const wrapper = new Store(options);

  let onNoPayload = false;
  let onPayload: any = null;

  const npPromise = wrapper.modules.module.actions.mnoPayload.after(() => {
    onNoPayload = true;
  });
  const pPromise = wrapper.modules.module.actions.mpayload.after(fnPayload => {
    onPayload = fnPayload;
  });

  const payload = { value: Math.random() };

  wrapper.modules.module.actions.mpayload(payload);
  wrapper.modules.module.actions.mnoPayload();

  expect(onPayload).toBe(null);
  expect(onNoPayload).toBe(false);

  await Promise.all([npPromise, pPromise]);

  expect(onPayload).toBe(payload);
  expect(onNoPayload).toBe(true);
});
