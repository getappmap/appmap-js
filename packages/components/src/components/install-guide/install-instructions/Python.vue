<template>
  <div>
    <section>
      Manual installation is a good option if:

      <ol>
        <li>
          Your project doesn't use <i>requirements.txt</i>, <i>Pipfile</i>, or <i>poetry.lock</i>.
        </li>
        <li>
          You want to install <code class="inline">appmap</code> from outside of the code editor.
        </li>
      </ol>
    </section>
    <section>
      <h3>Add the <code class="inline">appmap</code> package to your project</h3>
      <div>
        <v-code-snippet clipboard-text="pip install appmap" :kind="ctaButtonType" />
      </div>
      <div>
        <div class="center-block">or</div>
        <v-code-snippet clipboard-text="pipenv install --dev appmap" :kind="ctaButtonType" />
      </div>
      <div>
        <div class="center-block">or</div>
        <v-code-snippet clipboard-text="poetry add --dev appmap" :kind="ctaButtonType" />
      </div>
    </section>

    <section>
      <h3>Configure AppMap</h3>
      <p>
        Finalize the installation by running the command below. An <i>appmap.yml</i> configuration
        file will automatically be created in the current working directory.
      </p>
      <v-code-snippet clipboard-text="python -c 'import appmap'" :kind="ctaButtonType" />
    </section>
  </div>
</template>

<script>
import VCodeSnippet from '@/components/CodeSnippet.vue';

export default {
  name: 'PythonInstructions',
  components: { VCodeSnippet },
  props: { ctaButtonType: { type: String, default: 'primary' } },
};
</script>

<style lang="scss" scoped>
.center-block {
  display: flex;
  justify-content: center;
  margin: 1em;
}
</style>
