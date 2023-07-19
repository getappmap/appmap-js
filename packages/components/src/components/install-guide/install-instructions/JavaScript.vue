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

      <p>
        <span class="subheading">Install with NPM</span>
        <v-code-snippet
          clipboard-text="npm install --save-dev @appland/appmap-agent-js"
          class="mt-0"
        />
      </p>
      <p>
        <span class="subheading">Install with Yarn</span>
        <v-code-snippet clipboard-text="yarn add --dev @appland/appmap-agent-js" class="mt-0" />
      </p>
    </section>

    <section>
      <h3>Configure AppMap</h3>
      <p>
        Lastly, create an <i>appmap.yml</i> configuration file by following the
        <a
          href="https://appmap.io/docs/reference/appmap-agent-js.html#configuration"
          target="_blank"
        >
          AppMap Agent for JavaScript configuration guide.
        </a>
      </p>
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

.mt-0 {
  margin-top: 0;
}

.subheading {
  font-size: 90%;
  font-weight: 400;
  color: $gray4;
}
</style>
