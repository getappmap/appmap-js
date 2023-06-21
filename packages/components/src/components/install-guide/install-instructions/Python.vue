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

    <p>
      Finally, run the following script to automatically create an
      <code class="inline">appmap.yml</code> configuration file. This configuration will also be
      created the first time your application is run.
    </p>
    <v-code-snippet
      clipboard-text="python ~/.appmap/bin/validate_install.py"
      :kind="ctaButtonType"
    />
  </div>
</template>

<script>
import VCodeSnippet from '@/components/CodeSnippet.vue';

export default {
  name: 'Python',
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
