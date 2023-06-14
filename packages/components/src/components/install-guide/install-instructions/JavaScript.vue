<template>
  <div>
    <section>
      Manual installation is a good option if you want to install
      <code class="inline">appmap-agent-js</code> from outside of the code editor. However, you'll
      have to create the <i>appmap.yml</i> file yourself.
    </section>
    <br />

    <section>
      <h3>Add the <code class="inline">appmap</code> package to your project</h3>

      <div>
        <v-code-snippet clipboard-text="npm install --save-dev appmap-agent-js" />
      </div>
      <div>
        <div>OR</div>
        <v-code-snippet clipboard-text="yarn add --dev appmap-agent-js" />
      </div>
    </section>

    <section>
      <h3>Create <code class="inline">appmap.yml</code></h3>
      <br />
      <div>
        Follow the
        <a
          href="https://appmap.io/docs/reference/appmap-agent-js.html#configuration"
          target="_blank"
          >appmap-agent-js Configuration guide</a
        >.
      </div>
    </section>
  </div>
</template>

<script>
import VCodeSnippet from '@/components/CodeSnippet.vue';

export default {
  name: 'JavaScript',
  components: { VCodeSnippet },
};
</script>
<style lang="scss" scoped>
.center-block {
  display: flex;
  justify-content: center;
  margin: 1em;
}
</style>
