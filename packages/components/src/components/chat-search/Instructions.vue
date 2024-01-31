<template>
  <div class="instructions">
    <h2>Navie, the AppMap AI</h2>
    <div>
      <h3>How Navie Works</h3>
      <p>
        Each chat with Navie begins by analyzing your AppMaps. AppMaps are detailed recordings of
        your code behavior that
        <a href="#" @click.prevent="openRecordInstructions"
          >you create by running your app with the AppMap agent or language</a
        >
        library enabled. Naive uses the data in AppMaps (which includes dynamic information like
        database queries and web requests) as well as snippets of your code, to provide tailored
        responses and suggestions.
      </p>
      <p>
        Navie reports how many AppMaps were reviewed and the number of relevant source files used
        for each response. Accuracy improves as you create more diverse and up-to-date AppMaps. You
        can accomplish this by regularly interacting with your application and recording traces.
      </p>
      <p>
        <strong>Remember!</strong> The better your AppMaps match your question, the better Navie's
        answers will be.
      </p>
    </div>
    <div v-if="appmapStats">
      <h3>Your AppMaps</h3>
      <p v-if="appmapStats.numAppMaps">
        You have <strong>{{ appmapStats.numAppMaps }}</strong> AppMaps in your workspace. These
        AppMaps contain <strong>{{ appmapStats.packages.length }}</strong> packages and
        <strong>{{ appmapStats.classes.length }}</strong> classes.
        <span v-if="appmapStats.routes.length"
          >Your AppMaps contain <strong>{{ appmapStats.routes.length }}</strong> HTTP server routes
        </span>
        <span v-if="appmapStats.tables.length">
          <span v-if="appmapStats.routes.length">and </span>
          <span v-else>Your AppMaps contain </span
          ><strong>{{ appmapStats.tables.length }}</strong> SQL tables</span
        >.
      </p>
      <div data-cy="no-appmaps" v-else>
        <p>
          ⚠️ You don't have any AppMaps in your workspace. Before you can use Navie, you'll need to
          <a href="#" @click.prevent="openRecordInstructions">create some</a>.
        </p>
        <p>
          Navie uses AppMap diagrams, data, and snippets of your code code to understand your
          software and make suggestions. Navie’s accuracy improves as you make more AppMaps.
        </p>
        <p>
          Each recording method targets different scenarios and provides various levels of detail
          and control. For detailed instructions, visit
          <a
            href="https://appmap.io/docs/setup-appmap-in-your-code-editor/how-appmap-works.html"
            _target="blank"
            >AppMap Documentation</a
          >. Example methods include the following:
        </p>
        <dl>
          <dt>Requests recording</dt>
          <dd>
            Records an AppMap for every HTTP server request handled by a web application. It's
            interactive and generates AppMaps continuously.
          </dd>
          <dt>Test case recording</dt>
          <dd>
            Creates an AppMap for each test case in supported frameworks, naming files after test
            cases.
          </dd>
          <dt>Remote recording</dt>
          <dd>
            Similar to requests recording but includes non-HTTP activities. It starts and stops via
            HTTP commands to the AppMap agent.
          </dd>
          <dt>Code block recording</dt>
          <dd>
            Records a single AppMap for a code block. It's useful for recording a specific feature
            or bug fix.
          </dd>
          <dt>Process recording</dt>
          <dd>
            Records all configured code activities from application start to shutdown. It's useful
            for recording a specific feature or bug fix.
          </dd>
        </dl>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'v-instructions',

  props: {
    appmapStats: {
      type: Object,
    },
  },

  methods: {
    openRecordInstructions() {
      this.$root.$emit('open-record-instructions');
    },
  },
};
</script>
<style lang="scss" scoped>
.instructions {
  font-size: 0.9rem;
  color: $white;

  h2 {
    font-size: 1;
  }

  h3 {
    font-size: 0.9rem;
  }

  a {
    text-decoration: none;
    color: $lightblue;

    &:hover {
      color: $blue;
      transition: $transition;
      cursor: pointer;
    }
  }
}
</style>
