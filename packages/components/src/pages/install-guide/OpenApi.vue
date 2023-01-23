<template>
  <v-quickstart-layout>
    <section>
      <header>
        <h1>Generate OpenAPI</h1>
      </header>
      <main>
        <div v-if="userAuthenticated">
          <article v-if="numAppMaps === 0">
            No AppMaps have been found in your project. Try
            <a
              href="#"
              data-cy="record-appmaps"
              @click.prevent="$root.$emit('open-instruction', 'record-appmaps')"
            >
              recording AppMaps
            </a>
            first.
          </article>
          <article v-else-if="numHttpRequests > 0">
            <p class="message">
              AppMap has identified <strong>{{ numHttpRequests }} unique HTTP requests</strong> to
              various routes in your web application. Using this data, we can automatically generate
              OpenAPI definitions.
            </p>
            <div class="center">
              <v-button
                label="Generate OpenAPI definitions"
                data-cy="generate-openapi"
                @click.native="generateOpenApi"
              />
            </div>
          </article>
          <article v-else>
            AppMap was unable to detect any HTTP request handlers in your application.
          </article>
        </div>
        <div v-else>
          <article class="subheading">
            AppMap records the code’s runtime behavior, so it can see and record all of the API
            calls in the code, including the schema of each request and response. This allows AppMap
            to automatically output an OpenAPI definition with zero work for the developer.
          </article>
          <div class="feature-wrap" data-cy="openapi-info">
            <div class="feature">
              <h2 class="subhead">Show the API "as it really is"</h2>
              <ul>
                <li>
                  <strong>Schema: </strong>
                  The generated OpenAPI definition only includes information (paths, methods, status
                  codes, etc.) that has actually been observed in the AppMap data. So, if a
                  particular code behavior has not been observed in an AppMap, it won’t be present
                  in the definition.
                </li>
                <li>
                  <strong>Pull Request Review: </strong>
                  Generate an OpenAPI definintion for all new work—the diff of the OpenAPI changes
                  helps code reviewers to quickly get the “big picture”.
                </li>
                <li>
                  <strong>Deploy in CI: </strong>
                  Automatically generate and export an OpenAPI definition in your build system to
                  always keep your definition up-to-date!
                </li>
                <li><strong>And more!</strong></li>
              </ul>
            </div>
          </div>
          <a
            class="btn-auth center"
            data-cy="auth-button"
            @click.prevent="$root.$emit('perform-auth')"
          >
            <v-appmap-logo />
            <v-button label="Sign in to enable AppMap OpenAPI Generation" class="cta-button b-0" />
          </a>
        </div>
      </main>
      <v-navigation-buttons :first="first" :last="last" />
    </section>
  </v-quickstart-layout>
</template>

<script>
import VNavigationButtons from '@/components/install-guide/NavigationButtons.vue';
import VQuickstartLayout from '@/components/quickstart/QuickstartLayout.vue';
import VButton from '@/components/Button.vue';
import Navigation from '@/components/mixins/navigation';
import VAppmapLogo from '@/assets/appmap-logomark.svg';

export default {
  name: 'OpenApi',

  components: {
    VQuickstartLayout,
    VNavigationButtons,
    VButton,
    VAppmapLogo,
  },

  mixins: [Navigation],

  props: {
    numHttpRequests: Number,
    numAppMaps: Number,
    userAuthenticated: Boolean,
  },

  methods: {
    generateOpenApi() {
      this.$root.$emit('generate-openapi', this.projectPath);
    },
  },
};
</script>

<style lang="scss" scoped>
.message {
  margin-bottom: 1rem;
  strong {
    color: $brightblue;
  }
}
.subheading {
  font-size: 1.1rem;
  color: #939fb1;
  line-height: 1.6rem;
}
.feature {
  .subhead {
    margin-bottom: 0.5rem;
  }
  margin: 2.5rem 0;
  ul {
    margin-left: 1rem;
    margin-top: 0;
    li {
      strong {
        color: #939fb1;
      }
    }
  }
  strong {
    color: #939fb1;
  }
}
.btn-auth {
  align-items: center;
  background-color: $almost-black;
  border: 3px solid $gray-tertiary;
  border-radius: 1rem;
  box-shadow: $box-shadow-min;
  display: flex;
  flex-direction: row;
  justify-content: center;
  padding: 0.5rem 0.8rem;
  transition: $transition;
  width: 50%;
  min-width: 300px;
  margin-bottom: 40px;

  .cta-button {
    padding: 0.5rem 0.5rem 0.5rem 4rem;
  }
  svg {
    margin-right: -3rem;
    margin-left: 0.5rem;
    width: 32px;
  }
  &:hover {
    background-color: $black;
    box-shadow: $box-shadow-min;
    border-color: #5f729a;
    .cta-button {
      background: none;
    }
  }
}

.b-0 {
  border: none;
}
</style>
