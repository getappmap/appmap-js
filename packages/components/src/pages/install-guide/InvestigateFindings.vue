<template>
  <v-quickstart-layout>
    <section>
      <header>
        <h1 data-cy="title">
          AppMap Runtime Analysis
          <span v-if="!findingsEnabled">Early Access</span>
        </h1>
      </header>
      <main>
        <article v-if="!(findingsEnabled && scanned)" class="subheading">
          Find software design flaws that impact security, performance,
          stability, and maintainability. Our runtime code analysis can find the
          problems that static code analyzers miss — and that cause serious
          production issues.
        </article>
        <div v-if="findingsEnabled">
          <article v-if="!scanned">
            <p>
              <strong>This project has not been scanned yet.</strong>
            </p>
            <p>
              AppMap will scan your project and report findings automatically if
              you have:
            </p>

            <ol>
              <li>
                <a
                  href="#"
                  @click.prevent="
                    $root.$emit('open-instruction', 'project-picker')
                  "
                  >The AppMap Agent installed</a
                >
              </li>
              <li>
                <a
                  href="#"
                  @click.prevent="
                    $root.$emit('open-instruction', 'record-appmaps')
                  "
                >
                  AppMaps in your project</a
                >
              </li>
            </ol>
            <p>
              If you need help getting set up, we are happy to help open a
              support ticket.
            </p>
          </article>
          <article v-else-if="numFindings > 0">
            <p>
              AppMap has identified
              <badge
                v-for="domain in [
                  'security',
                  'performance',
                  'stability',
                  'maintainability',
                ]"
                :key="domain"
                :data-cy="domain"
                :class="domain"
              >
                {{ findingsDomainCounts[domain] }} {{ domain }}
              </badge>
              findings.
            </p>
            <br />
            <p>
              <v-button
                data-cy="investigate-findings-button"
                label="Open the PROBLEMS tab"
                @click.native="viewProblems"
              />
            </p>
          </article>
          <article v-else>
            <p>
              You're good to go! AppMap scanned your application and found no
              flaws. We'll continue scanning for flaws automatically.
            </p>
          </article>
        </div>
        <article v-if="!findingsEnabled">
          <div class="feature-wrap content">
            <a
              class="youtube-video"
              href="https://appland.com/docs/analysis#demo"
            >
              <img
                class="video-thumbnail"
                alt="runtime analysis video thumbnail"
                src="../../assets/runtime_analysis_video_thumbnail.png"
              />
            </a>
            <div class="feature">
              <h2 class="subhead">
                Identify design flaws and anti-patterns before they’re merged
              </h2>
              <ul>
                <li>
                  <strong>Security: </strong>
                  authorization without authentication, secrets accidentally
                  logged, server requests missing authentication.
                </li>
                <li>
                  <strong>Performance: </strong>
                  N+1 queries, excessive SQL joins, slow function calls.
                </li>
                <li>
                  <strong>Maintainability: </strong>
                  GETs that make updates, circular package dependencies, queries
                  made from views.
                </li>
                <li>
                  <strong>Stability: </strong>
                  HTTP requests incompatible with an OpenAPI spec, remote calls
                  made without circuit breaker, missing content types.
                </li>
                <li><strong>And more!</strong></li>
              </ul>
            </div>
            <a
              class="btn-slack"
              data-cy="slack-button"
              href="https://appmap.io/slack"
            >
              <SlackLogo />
              <v-button
                label="Join our Slack for early access"
                class="cta-button b-0"
              />
            </a>
          </div>
        </article>
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
import SlackLogo from '@/assets/Slack_Mark.svg';

export default {
  name: 'InvestigateFindings',

  components: {
    VQuickstartLayout,
    VNavigationButtons,
    VButton,
    SlackLogo,
  },

  mixins: [Navigation],

  props: {
    scanned: Boolean,
    numFindings: Number,
    projectPath: String,
    findingsDomainCounts: {
      type: Object,
      default: () => ({
        security: 0,
        performance: 0,
        reliability: 0,
        maintainability: 0,
      }),
    },
    findingsEnabled: Boolean,
  },

  methods: {
    viewProblems() {
      this.$root.$emit('view-problems', this.projectPath);
    },
  },
};
</script>
<style lang="scss" scoped>
.subheading {
  font-size: 1.1rem;
  color: #939fb1;
  line-height: 1.6rem;
}

.columns {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
  margin: -1.75rem;
  padding: 1.75rem 2rem 2rem 2rem;
  border-bottom: 1px solid #939fb140;
  &.hero {
    background: linear-gradient(180deg, #242c41 33%, #202739 100%);
  }
  .feature-wrap {
    &.cta {
      min-width: 350px;
    }
  }
}

.feature-wrap {
  &.content {
    padding-top: 1rem;
  }
}

.feature {
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
  &.cta-slack {
    border-radius: 1rem;
    background-color: $gray-tertiary;
    padding: 0.75rem 1rem;
    margin-bottom: 0rem;
    h2 {
      border-bottom: 1px solid $gray-secondary;
      padding: 0 1rem 0.35rem 1rem;
      margin: 0 -1rem 0.25rem -1rem;
    }

    .support-list {
      list-style-type: none;
      margin-top: 0;
      margin-left: 0;
      padding: 0;
      li {
        align-items: center;
        display: flex;
        flex-direction: row;
        gap: 0.25rem;
        line-height: 2.25rem;
        padding: 0;
        strong {
          color: $almost-white;
        }
        &:first-of-type {
          margin-top: 0.5rem;
        }
      }
    }
  }
  h2 {
    font-weight: 600;
    line-height: 1.8rem;
    margin-bottom: 0.5rem;
  }
}

.youtube-video {
  align-items: center;
  border: 3px solid $gray-tertiary;
  box-shadow: $box-shadow-min;
  display: flex;
  flex-direction: row;
  justify-content: center;
  transition: $transition;
  width: 50%;
  min-width: 400px;
  margin: 30px 0 50px 0;
  &:hover {
    box-shadow: $box-shadow-min;
    border-color: #5f729a;
  }

  .video-thumbnail {
    width: 100%;
  }
}

.cta-logo {
  width: 25px;
  height: 25px;
  margin: 0 0.25rem;
}

.btn-slack {
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

.security {
  color: #ff4141;
  padding: 5px;
  font-weight: bold;
}
.performance {
  color: orange;
  padding: 5px;
  font-weight: bold;
}
.stability {
  color: yellow;
  padding: 5px;
  font-weight: bold;
}
.maintainability {
  color: white;
  padding: 5px;
  font-weight: bold;
}

@media (min-width: 1000px) {
  .columns {
    .feature-wrap {
      &.cta {
        .cta-slack {
          margin-top: 0;
          .btn-slack {
            margin-top: 1rem;
          }
        }
      }
    }
  }
}

@media (max-width: 1000px) {
  header,
  .feature-wrap.cta {
    width: 100%;
  }
  .columns {
    flex-direction: column;
    gap: 0.5rem;
  }
  .feature-wrap {
    .feature {
      &.cta-slack {
        margin-top: 1rem;
        .btn-slack {
          margin-top: 1rem;
        }
      }
    }
  }
}

@media (max-width: 625px) {
  .btn-slack {
    min-width: unset;
    width: 100%;
  }
}
@media (max-width: 420px) {
  .btn-slack {
    .cta-button {
      text-align: left;
    }
    svg {
      width: 2rem;
    }
  }
}
</style>
