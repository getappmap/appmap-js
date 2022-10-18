<template>
  <div>
    <section>
      <h4>Installation via <code class="inline">pip</code></h4>
      <v-code-snippet clipboard-text="pip install appmap" />
    </section>

    <section>
      <h4>Installation via <code class="inline">poetry</code></h4>
      <v-code-snippet clipboard-text="poetry add --dev appmap" />
    </section>

    <section>
      <h4>Installation via <code class="inline">pipenv</code></h4>
      <v-code-snippet clipboard-text="pipenv install --dev appmap" />
    </section>
  </div>
</template>

<script>
import VCodeSnippet from '@/components/CodeSnippet.vue';

export default {
  name: 'Python',
  components: { VCodeSnippet },
};
</script>
