import Vue, { ComponentOptions } from "vue";
import { Store } from "./store";

export { Store as TStore };

let installedVue: Vue | null = null;

export interface TComponentOptions<V extends Vue, M, R, O>
  extends ComponentOptions<V> {
  tstore?: Store<M, R, O>;
}

export function install(vue: any) {
  if (installedVue && vue === installedVue) {
    console.error(
      "[vuex-tstore] already installed. Vue.use(TStore) should be called only once."
    );
    return;
  }

  installedVue = vue;
  applyMixin(vue);
}

function applyMixin(vue: any) {
  const version = Number(vue.version.split(".")[0]);

  if (version >= 2) {
    vue.mixin({ beforeCreate: tstoreInit });
  } else {
    const _init = vue.prototype._init;
    vue.prototype._init = function(options: any = {}) {
      options.init = options.init
        ? [tstoreInit].concat(options.init)
        : tstoreInit;
      _init.call(this, options);
    };
  }
  function tstoreInit(this: Vue) {
    const options = this.$options;

    if ((options as any).tstore) {
      (this as any).$tstore =
        typeof (options as any).tstore === "function"
          ? (options as any).tstore()
          : (options as any).tstore;
    } else if (options.parent && (options.parent as any).$tstore) {
      (this as any).$tstore = (options.parent as any).$tstore;
    }
  }
}

export default { Store, install };
