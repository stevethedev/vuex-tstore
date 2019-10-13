/**
 * Extends interfaces in Vue.js
 */

import Vue, { ComponentOptions } from "vue";
import { TStore, TComponentOptions } from "../src/index";

declare module "vue/types/vue" {
  interface Vue {
    $tstore: TStore<any, any, any>;
  }

  interface VueConstructor<V extends Vue = Vue> {
    new <M, R, O>(options?: TComponentOptions<V, M, R, O>): CombinedVueInstance<
      V,
      object,
      object,
      object,
      Record<keyof object, any>
    >;
  }
}

declare module "vue/types/options" {
  interface ComponentOptions<V extends Vue> {
    tstore?: TStore<any, any, any>;
  }
}
