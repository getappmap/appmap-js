<template>
  <div class="instructions">
    <div class="instructions__stats" v-if="appmapStats">
      <h2>Your AppMaps</h2>
      <div v-if="appmapStats.numAppMaps">
        <div class="instructions__stats__sub-heading">
          <p>
            <strong>{{ appmapStats.numAppMaps }} </strong> AppMaps in your workspace
          </p>
          <div class="divider">|</div>
          <v-button
            data-cy="create-more-appmaps-btn"
            class="create-more-appmaps"
            size="small"
            kind="ghost"
            @click.native="openRecordInstructions"
          >
            Create more
          </v-button>
        </div>
        <div class="instructions__stats__details">
          <div class="instructions__stats__details-row">
            <div class="stats-number">
              <strong>{{ appmapStats.packages.length }}</strong>
            </div>
            packages
          </div>
          <div class="instructions__stats__details-row light-bg">
            <div class="stats-number">
              <strong>{{ appmapStats.classes.length }}</strong>
            </div>
            classes
          </div>
          <div class="instructions__stats__details-row" v-if="appmapStats.routes.length">
            <div class="stats-number">
              <strong>{{ appmapStats.routes.length }}</strong>
            </div>
            HTTP server routes
          </div>
          <div class="instructions__stats__details-row light-bg" v-if="appmapStats.tables.length">
            <div class="stats-number">
              <strong>{{ appmapStats.tables.length }}</strong>
            </div>
            SQL tables
          </div>
        </div>
      </div>
      <div data-cy="no-appmaps" v-else>
        <div class="instructions__stats__sub-heading">
          <p>⚠️ <strong>0</strong> AppMaps in your workspace</p>
          <div class="divider">|</div>
          <v-button
            data-cy="create-some-appmaps-btn"
            class="create-some-appmaps"
            size="small"
            kind="ghost"
            @click.native="openRecordInstructions"
          >
            Create some
          </v-button>
        </div>
        <h3>Navie requires AppMaps</h3>
        <p>
          Navie uses AppMap diagrams, data, and snippets of your code code to understand your
          software and make suggestions.
        </p>
      </div>
    </div>
    <div class="instructions__container">
      <h2>
        The better your AppMaps match your question,
        <br />
        the better Navie's answers will be.
      </h2>
      <h3>How Navie Works</h3>
      <p>Each chat with Navie begins by analyzing your AppMaps.</p>
      <p>
        AppMaps are detailed recordings of your code behavior that
        <a href="#" @click.prevent="openRecordInstructions"
          >you create by running your app with the AppMap agent or language</a
        >
        library enabled.
      </p>
      <p>
        Naive uses the data in AppMaps (which includes dynamic information like database queries and
        web requests) as well as snippets of your code, to provide tailored responses and
        suggestions.
      </p>
      <p>
        Navie reports how many AppMaps were reviewed and the number of relevant source files used
        for each response.
      </p>
      <p>
        Accuracy improves as you create more diverse and up-to-date AppMaps. You can accomplish this
        by regularly interacting with your application and recording traces.
      </p>
    </div>
  </div>
</template>
<script>
import VButton from '@/components/Button.vue';

export default {
  name: 'v-instructions',

  components: {
    VButton,
  },

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
  background-color: $gray1;
  overflow: scroll;

  a {
    text-decoration: none;
    color: $lightblue;

    &:hover {
      color: $blue;
      transition: $transition;
      cursor: pointer;
    }
  }

  &__stats {
    background-color: #181c28;
    padding: 1.75rem 1.75rem 2.5rem 1.75rem;

    h2 {
      margin-bottom: 1.25rem;
      margin-top: 0;
    }

    &__sub-heading {
      display: flex;
      align-items: center;

      .divider {
        margin: 0 0.75rem;
      }
    }

    &__details {
      width: fit-content;

      &-row {
        display: flex;
        padding: 0.2rem 12rem 0.2rem 0.75rem;

        .stats-number {
          width: 30px;
        }
      }

      .light-bg {
        background-color: #242b3e;
      }
    }
  }

  &__container {
    margin: 5rem auto;
    padding: 4rem 3rem 6rem 3rem;
    width: 75%;
    color: lighten($lightblue, 20%);
    border: 1px solid lighten($blue, 10%);
    border-radius: $border-radius;
    box-shadow: 0 0 1.2rem 0rem lighten($lightblue, 5%);

    h2 {
      margin-top: 0;
      margin-bottom: 2.5rem;
    }

    h3 {
      font-size: 1.1rem;
      margin-bottom: 1.8rem;
    }
  }
}
</style>
