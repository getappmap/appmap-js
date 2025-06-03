<template>
  <section id="test-analysis" class="test-analysis">
    <div class="test-analysis__container">
      <section-heading
        title="Test Analysis"
        subtitle="When test coverage is available for code change, AppMap can use the runtime data generated from running the tests to help improve the accuracy and completeness of the analysis."
      />
      <div class="test-analysis__table-wrapper">
        <table class="test-analysis__table">
          <thead class="test-analysis__table-head">
            <tr>
              <th scope="col" class="test-analysis__th">Feature</th>
              <th scope="col" class="test-analysis__th">Test Coverage</th>
            </tr>
          </thead>
          <tbody class="test-analysis__table-body">
            <tr v-for="(item, index) in testCoverageItems" :key="index" class="test-analysis__tr">
              <td class="test-analysis__td test-analysis__td--feature">
                <span class="test-analysis__icon-placeholder" aria-hidden="true">✓</span>
                <span>{{ item.feature }}</span>
              </td>
              <td class="test-analysis__td test-analysis__td--coverage">
                <div
                  v-for="(line, i) in item.coverage.split('\n')"
                  :key="i"
                  class="test-analysis__coverage-line"
                >
                  {{ line }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import Vue from 'vue';
import SectionHeading from '@/components/review/SectionHeading.vue';

interface TestCoverageItem {
  feature: string;
  coverage: string;
}

const testCoverageData: TestCoverageItem[] = [
  {
    feature: 'Added user authentication via Spring Security with support for user roles',
    coverage:
      'src/test/java/org/springframework/samples/petclinic/security/LoginTests.java:26-50 (testSuccessfulLoginAsAdmin and testSuccessfulLoginAsUser)',
  },
  {
    feature: 'Added CSRF protection to all form submissions',
    coverage:
      'src/test/java/org/springframework/samples/petclinic/owner/OwnerControllerTests.java:117-126 (testProcessCreationFormSuccess)\nsrc/test/java/org/springframework/samples/petclinic/owner/PetControllerTests.java:94-120 (testProcessCreationFormSuccess)',
  },
  {
    feature: 'Added logout feature',
    coverage:
      'src/test/java/org/springframework/samples/petclinic/security/LoginTests.java:95-106 (testLogout)',
  },
  {
    feature:
      'Added functionality to redirect users back to their originally requested page after successful login',
    coverage:
      'src/test/java/org/springframework/samples/petclinic/security/LoginTests.java:52-76 (testSuccessfulRedirectAfterLogin)',
  },
  {
    feature: 'Added support for internationalized (i18n) login/logout text',
    coverage:
      'src/test/java/org/springframework/samples/petclinic/system/I18nPropertiesSyncTest.java:25-83 (checkNonInternationalizedStrings)',
  },
];

export default Vue.extend({
  name: 'TestAnalysis',
  components: {
    SectionHeading,
  },
  data() {
    return {
      testCoverageItems: testCoverageData as TestCoverageItem[],
    };
  },
});
</script>

<style scoped lang="scss">
$text-sm-equivalent: $font-size;
$text-xs-equivalent: 12px;

.test-analysis {
  padding-top: 2.5rem;
  padding-bottom: 2.5rem;
  background-color: $color-input-bg;
  font-family: $font-family;
  color: $color-foreground-dark;

  &__container {
    width: 100%;
    max-width: $max-width; //
    margin-left: auto;
    margin-right: auto;
    padding-left: 1rem;
    padding-right: 1rem;
  }

  &__table-wrapper {
    margin-top: 2rem;
    overflow-x: auto;
    border-radius: $border-radius;
  }

  &__table {
    min-width: 100%;
    border-collapse: collapse;
  }

  &__table-head {
    background-color: $color-tile-background;
  }

  &__th {
    padding: 0.75rem 1.5rem;
    text-align: left;
    font-size: $text-sm-equivalent;
    font-weight: 500;
    color: $color-foreground-dark;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid $color-border;
  }

  &__table-body {
    background-color: $color-tile-background;
  }

  &__tr {
    transition: background-color 0.2s ease-in-out;

    &:hover {
      background-color: lighten($color-tile-background, 5%);
    }

    &:not(:first-child) {
      td {
        // This creates the divide-y effect for rows within the tbody
        // border-top: 1px solid $color-border; (Handled by th border-bottom and td border-top)
      }
    }
  }

  &__td {
    padding: 1rem 1.5rem; //
    font-size: $text-sm-equivalent;
    color: $color-input-fg;
    white-space: normal;
    vertical-align: top;
    border-bottom: 1px solid $color-border;

    &--feature {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
    }

    &--coverage {
      font-family: monospace;
      font-size: $text-xs-equivalent;
      color: $color-foreground-dark;
      white-space: pre-line;
    }
  }

  .test-analysis__tr:last-child .test-analysis__td {
    border-bottom: none;
  }

  &__icon-placeholder {
    color: $color-link;
    min-width: 1.25rem;
    height: 1.25rem;
    flex-shrink: 0;
    margin-top: 0.125rem;
    display: inline-block;
    font-weight: bold;
  }

  &__coverage-line {
    margin-bottom: 0.25rem;
    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style>
