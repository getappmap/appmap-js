<template>
  <div class="diagram-ai">
    <p>
      AppMap has an embedded AI agent which can answer questions about the code base, and generate
      code suggestions, based on a combination of your source code and the runtime data in the
      AppMap.
    </p>
    <p>
      To get started using the AI, search for a function, query, or HTTP server request in the
      search bar. Click "Include in Context" to include this code object in the prompt which is sent
      to the AI. The source code of that object, if available, will be included in the prompt.
      Elements of the AppMap that are related to that object will be sent as well.
    </p>
    <div>
      <ul v-if="contextItems.length">
        <li v-for="(item, index) in contextItems" :key="index">{{ nameOf(item) }}</li>
      </ul>

      <div class="user-prompt">
        <p>Ask a multi-line question about the code base:</p>
        <textarea class="prompt" rows="10" placeholder="Ask a question" />
        <br />
        <p>Response type:</p>
        <div class="user-prompt">
          <label>
            <input type="radio" name="responseType" value="text" checked />
            Text
          </label>
          <label>
            <input type="radio" name="responseType" value="code" />
            Code
          </label>
          <label>
            <input type="radio" name="responseType" value="mixed" />
            Text and code
          </label>
        </div>
        <br />
        <button :disabled="contextItems.length === 0" @click="onAsk">Ask</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'v-diagram-ai',
  computed: {
    // Use a computed property to derive state from the store
    contextItems() {
      return this.$store.state.aiContext;
    },
  },
  methods: {
    nameOf(item) {
      return item.prettyName || item.name || item.toString();
    },
    onAsk() {
      if (this.contextItems.length === 0) return;

      const question = this.$el.querySelector('textarea.prompt').value;
      if (!question) return;

      const prompt = {
        context: this.contextItems.map((item) => item.fqid),
        question,
        responseType: this.$el.querySelector('input[name=responseType]:checked').value,
      };
      this.$root.$emit('askAI', prompt);
    },
  },
};
</script>

<style lang="scss" scoped>
.diagram-ai {
  font-family: 'IBM Plex Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 0.9em;
  color: $base03;

  > p,
  > div {
    margin: 0 1rem 1rem 1rem;
  }

  .user-prompt textarea {
    width: 100%;
  }
}
</style>
