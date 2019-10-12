/**
 * Extends interfaces in Vue.js
 */

import Vue, { ComponentOptions } from "vue";
import { TStore } from "../src/index";

declare module "vue/types/vue" {
  interface Vue {
    $tstore: TStore<any, any, any>;
  }
}

declare module "vuex/types/index" {
  interface Store<S> {
    $tstore: TStore<any, any, any>;
  }
}
