<template>
  <div>
    <section>
      Manual installation is a good option if:

      <ol>
        <li>
          Your project doesn't use <i>requirements.txt</i>, <i>Pipfile</i>, or <i>poetry.lock</i>.
        </li>
        <li>You want to install <tt>appmap</tt> from outside of the code editor.</li>
      </ol>
    </section>
    <section>
      <h3>Add the <tt>appmap</tt> package to your project</h3>
      <div>
        <v-code-snippet clipboard-text="pip install appmap" />
      </div>
      <div>
        <div class="center-block">or</div>
        <v-code-snippet clipboard-text="pipenv install --dev appmap" />
      </div>
      <div>
        <div class="center-block">or</div>
        <v-code-snippet clipboard-text="poetry add --dev appmap" />
      </div>
    </section>

    <section>
      <h3>Generate configuration file <i>appmap.yml</i></h3>
      <div>
        Linux, MacOS:

        <v-code-snippet clipboard-text="python $HOME/.appmap/bin/validate_install.py" />
      </div>
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
<style lang="scss" scoped>
.center-block {
  display: flex;
  justify-content: center;
  margin: 1em;
}
</style>
