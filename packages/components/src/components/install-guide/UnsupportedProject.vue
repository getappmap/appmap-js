<template>
  <div>
    <template v-if="!languageSupported">
      <p>
        This project does not meet all the requirements to create AppMaps. AppMap currently supports
        the following languages:
      </p>
      <ul class="support-list">
        <li><strong>Ruby</strong></li>
        <li><strong>Python</strong></li>
        <li><strong>JavaScript</strong></li>
        <li><strong>Java</strong></li>
      </ul>
      <p data-cy="inform-user">
        While AppMap data cannot be recorded for this project,
        <a href="#" @click.prevent="$root.$emit('open-navie')" data-cy="open-navie"> Navie </a>
        can still search through the code available in your project.
      </p>
    </template>
    <template v-else>
      <p class="mb20">
        We weren't able to find a supported web or test framework within this project. Please visit
        <a :href="documentationUrl">our {{ language.name }} documentation</a> for more information.
      </p>
    </template>
  </div>
</template>

<script>
import { isFeatureSupported } from '@/lib/project';
import { getAgentDocumentationUrl } from '@/lib/documentation';

export default {
  name: 'unsupported-project',
  props: {
    language: Object,
  },
  computed: {
    languageSupported() {
      return isFeatureSupported(this.language);
    },
    documentationUrl() {
      return getAgentDocumentationUrl(this.language && this.language.name);
    },
  },
};
</script>

<style lang="scss" scoped>
.support-list {
  margin: 1rem 0;
  list-style-position: inside;
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
</style>
