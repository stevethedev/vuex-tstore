/**
 * Extends interfaces in Vue.js
 */

import Vue, { ComponentOptions } from "vue";
import { Store } from "../src/index";

declare module "vue/types/options" {
  interface ComponentOptions<V extends Vue> {
    tstore?: Store<any, any, any>;
  }
}

declare module "vue/types/vue" {
  interface Vue {
    $tstore: Store<any, any, any>;
  }
}
