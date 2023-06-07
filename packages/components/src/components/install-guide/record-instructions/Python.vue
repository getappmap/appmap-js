<template>
  <section>
    <p class="mb20 bold">
      When you run your Python code with the <tt>appmap</tt> package, AppMap will be enabled for
      recording. The best way to run with AppMap is to add the <tt>appmap</tt> package using Pip,
      Pipenv, or Poetry.
    </p>
    <template v-if="testFramework">
      <h3>Tests recording</h3>
      <p>
        When you run your {{ testFramework.name }} tests with AppMap enabled, an AppMap will be
        created for each test.
      </p>
      <template v-if="testFramework.name.toLowerCase() == 'pytest'">
        Run Pytest tests:
        <v-code-snippet clipboard-text="pytest" />
      </template>
      <p>
        For more information, visit
        <a
          href="https://appmap.io/docs/reference/appmap-python.html#tests-recording"
          target="_blank"
          >AppMap docs - Python Tests recording</a
        >.
      </p>
    </template>
    <template v-else>
      <VTestsPrompt frameworks="pytest or unittest" />
    </template>
    <template v-if="webFramework">
      <h3>Requests recording</h3>
      <p>
        When your application uses {{ this.webFramework.name }}, and you run your application with
        AppMap enabled, HTTP server requests recording is enabled. To record requests, first run
        your application:
      </p>
      <p>
        Start your Django server:
        <v-code-snippet clipboard-text="python manage.py runserver" />
      </p>
      <p>
        Start your Flask server:
        <v-code-snippet clipboard-text="flask run" />
      </p>
      <p>
        Interact with your application, through its user interface and/or by making API requests
        using a tool such as Postman. An AppMap will be created for each HTTP server request that's
        served by your app.
      </p>
      <p>
        For more information, visit
        <a
          href="https://appmap.io/docs/reference/appmap-python.html#requests-recording"
          target="_blank"
          >AppMap docs - Python Requests recording</a
        >.
      </p>
    </template>
    <template v-else>
      <VWebFrameworkPrompt frameworks="Django or Flask" />
    </template>
    <section>
      <h3>Context manager recording</h3>
      <p>
        You can use the AppMap Python package directly to record a specific span of code. With this
        method, you can control exactly what code is recorded, and where the recording is saved. To
        use Context manager recording, add an AppMap code snippet to the section of code you want to
        record, then run your application with AppMap enabled. Visit
        <a
          href="https://appmap.io/docs/reference/appmap-python.html#context-manager-recording"
          target="_blank"
          >AppMap Docs - Python Context manager recording</a
        >
        for more information.
      </p>
    </section>
  </section>
</template>
<script>
import VCodeSnippet from '@/components/CodeSnippet.vue';
import VTestsPrompt from './TestsPrompt.vue';
import VWebFrameworkPrompt from './WebFrameworkPrompt.vue';

export default {
  name: 'Python',

  props: {
    webFramework: Object,
    testFramework: Object,
    theme: String,
  },

  components: { VCodeSnippet, VTestsPrompt, VWebFrameworkPrompt },

  computed: {},
};
</script>
