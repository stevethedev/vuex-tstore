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

declare module "vue/types/options" {
  interface ComponentOptions<V extends Vue> {
    tstore?: TStore<any, any, any>;
  }
}
