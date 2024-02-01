<template>
  <v-quickstart-layout>
    <section>
      <header>
        <h1 data-cy="title">AppMap Navie</h1>
      </header>
      <main>
        <v-status
          :status-states="statusStates"
          :current-status="statusStates[2]"
          :project-name="projectName"
          :num-app-maps="numAppMaps"
          :current-step="0"
          :viewing-step="2"
          class="mb20"
        >
          <template #header> AppMap setup is complete for {{ projectName }} </template>
        </v-status>
        <article class="subheading">
          Navie uses your AppMaps to provide you with relevant and specific insights about your
          project.
        </article>
        <article v-if="hasAppmaps" class="tips">
          <div class="tip">
            <v-visualization-icon class="tip-icon visualize-icon" />
            <div class="tip-info">
              <h3>Navie can show you the way</h3>
              <p>
                When you ask Navie a question, Navie will find relevant AppMaps and show you helpful
                visualizations of your code.
              </p>
            </div>
          </div>
          <div class="tip">
            <v-compass-icon class="tip-icon compass-icon" />
            <div class="tip-info">
              <h3>Navie knows about your project</h3>
              <p>
                Navie uses your AppMaps to understand your code and provide you with relevant
                insights. If you ask about a method that's not in your AppMaps, Navie won't know
                about it!
              </p>
            </div>
          </div>
          <div class="tip">
            <v-learning-icon class="tip-icon learning-icon" />
            <div class="tip-info">
              <h3>Navie is always learning</h3>
              <p>
                The more AppMaps that you create, the more Navie learns about your project and the
                more Navie can help you.
              </p>
            </div>
          </div>
          <v-button
            class="open-navie-btn"
            data-cy="open-navie-button"
            label="Try Navie Now"
            @click.native="openNavie"
          />
        </article>
        <article class="no-appmaps" v-else>
          <h3>You don't have any AppMaps</h3>
          <p>
            Navie uses your AppMaps to understand your code and provide you with relevant insights.
            For best results, please record AppMaps before using Navie.
          </p>
          <v-button
            class="open-navie-btn"
            data-cy="record-appmaps-button"
            label="Record AppMaps"
            @click.native="$root.$emit('open-instruction', 'record-appmaps')"
          />
        </article>
      </main>
      <v-navigation-buttons :first="false" :last="true" />
    </section>
  </v-quickstart-layout>
</template>

<script>
import VNavigationButtons from '@/components/install-guide/NavigationButtons.vue';
import VQuickstartLayout from '@/components/quickstart/QuickstartLayout.vue';
import VCompassIcon from '@/assets/compass-icon.svg';
import VStatus from '@/components/install-guide/Status.vue';
import VButton from '@/components/Button.vue';
import Navigation from '@/components/mixins/navigation';
import StatusState from '@/components/mixins/statusState.js';
import VVisualizationIcon from '@/assets/fa-solid_map.svg';
import VLearningIcon from '@/assets/open_book.svg';

export default {
  name: 'NavieIntroduction',

  components: {
    VQuickstartLayout,
    VNavigationButtons,
    VStatus,
    VButton,
    VVisualizationIcon,
    VCompassIcon,
    VLearningIcon,
  },

  mixins: [Navigation, StatusState],

  props: {
    projectName: {
      type: String,
      default: '',
    },
    numAppMaps: {
      type: Number,
      default: 0,
    },
  },

  computed: {
    hasAppmaps() {
      return this.numAppMaps && this.numAppMaps > 0;
    },
  },

  methods: {
    openNavie() {
      this.$root.$emit('open-navie');
    },
  },
};
</script>
<style lang="scss" scoped>
main {
  margin-bottom: 3rem;

  .subheading {
    font-size: 1.1rem;
    color: #939fb1;
    line-height: 1.6rem;
    margin-bottom: 1rem;
  }

  .tips {
    margin-bottom: 3.6rem;

    .tip {
      display: flex;
      align-items: center;
      width: 85%;
      margin: 0 2rem;
      line-height: 1.5;

      .tip-icon {
        margin-right: 2rem;
        fill: lighten(#939fb1, 20%);
      }

      .compass-icon {
        width: 3.1rem;
        height: 3.1rem;

        path {
          fill: lighten(#939fb1, 20%);
        }
      }

      .visualize-icon {
        width: 2.1rem;
        height: 2.1rem;
      }

      .learning-icon {
        width: 2rem;
        height: 2rem;
      }

      .tip-info {
        h3 {
          margin-bottom: 0.3rem;
        }

        p {
          line-height: normal;
          color: lighten(#939fb1, 10%);
          margin: 0.3rem 0;
        }
      }
    }
    .open-navie-btn {
      margin-top: 2.5rem;
      margin-left: 1.5rem;
    }
  }

  .no-appmaps {
    width: 90%;
    margin: 0 auto;

    h3 {
      margin-bottom: 0.6rem;
    }

    p {
      color: lighten(#939fb1, 10%);
      margin-bottom: 2.3rem;
      line-height: normal;
    }
  }
}
</style>
