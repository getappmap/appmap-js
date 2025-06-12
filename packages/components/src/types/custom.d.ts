import { DefineComponent } from 'vue';

declare module '*.svg' {
  const content: DefineComponent<{}>;
  export default content;
}

declare module '*.vue' {
  import Vue from 'vue';
  export default Vue;
}
