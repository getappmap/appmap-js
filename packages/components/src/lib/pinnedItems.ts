import Vue from 'vue';

interface ObservableContent {
  content: string;
  metadata: Record<string, string>;
}

/***
 * A registry for pinned items. This is used to keep track of pinned items and their content in an
 * observable way.
 */
class PinnedItemRegistry {
  private pinnedContent = new Map<string, ObservableContent>();

  constructor() {}

  private getOrCreate(id: string): ObservableContent {
    let obj = this.pinnedContent.get(id);
    if (!obj) {
      obj = Vue.observable({ content: '', metadata: {} });
      this.pinnedContent.set(id, obj);
    }
    return obj;
  }

  setMetadata(id: string, key: string, value: string) {
    const obj = this.getOrCreate(id);
    Vue.set(obj.metadata, key, value);
  }

  appendContent(id: string, content: string) {
    const obj = this.getOrCreate(id);
    Vue.set(obj, 'content', obj.content + content);
  }

  get(id: string): ObservableContent | undefined {
    return this.pinnedContent.get(id);
  }

  clear() {
    this.pinnedContent.clear();
  }
}

export const pinnedItemRegistry = new PinnedItemRegistry();
