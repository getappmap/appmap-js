<template>
  <div>
    <section>
      Manual installation is a good option if you want to install <tt>appmap-agent-js</tt> from
      outside of the code editor. However, you'll have to create the <i>appmap.yml</i> file
      yourself.
    </section>

    <section>
      <h3>Add the <tt>appmap</tt> package to your project</h3>

      <div>
        <v-code-snippet clipboard-text="npm install --save-dev appmap-agent-js" />
      </div>
      <div>
        <div class="center-block">or</div>
        <v-code-snippet clipboard-text="yarn add --dev appmap-agent-js" />
      </div>
    </section>

    <section>
      <h3>Create <tt>appmap.yml</tt></h3>
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
