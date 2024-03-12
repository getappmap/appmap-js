<template>
  <div class="instructions">
    <div class="instructions__container">
      <div class="instructions__appmaps">
        <h2>Most recent AppMap recordings</h2>
        <p>
          When you run your application with the AppMap recording agent enabled, recordings will
          automatically be captured as you make HTTP requests, run tests, or execute AppMap
          recording code blocks.
        </p>
        <p class="mb-0">
          Each recording can individually be viewed as a <b>sequence diagram</b>,
          <b>component diagram</b>, <b>flame graph</b>, and more. When talking to Navie, these same
          recordings will be used to provide you with the most accurate and relevant information.
        </p>
      </div>

      <div class="instructions__appmap-list" v-if="appmaps && appmaps.length">
        <v-appmap-list-item
          v-for="appmap in appmaps"
          :key="appmap.path"
          :name="appmap.name"
          :recording-method="appmap.recordingMethod"
          :created-at="appmap.createdAt"
          :path="appmap.path"
          data-cy="appmap-list-item"
        />
      </div>

      <template>
        <div v-if="appmaps && appmaps.length">
          All recordings are also located in the
          <a href="#" @click.prevent="showAppMapTree">AppMap sidebar panel.</a>
        </div>
        <div v-else>You do not yet have any AppMap recordings.</div>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import Vue, { PropType } from 'vue';
import VAppmapListItem from '@/components/AppmapListItem.vue';

type AppMapMetadata = {
  recordingMethod: string;
  name: string;
  createdAt: string;
  path: string;
};

export default Vue.extend({
  name: 'v-instructions',

  components: {
    VAppmapListItem,
  },

  props: {
    appmaps: Array as PropType<AppMapMetadata[]>,
  },

  methods: {
    showAppMapTree(): void {
      this.$root.$emit('show-appmap-tree');
    },
    openAppMap(path: string): void {
      this.$root.$emit('open-appmap', path);
    },
  },
});
</script>

<style lang="scss" scoped>
.instructions {
  font-size: 0.9rem;
  color: $white;
  background-color: $gray1;
  max-height: 100%;
  overflow-y: auto;

  .mb-0 {
    margin-bottom: 0;
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

  &__appmap-list {
    display: flex;
    flex-direction: column;
    border-radius: $border-radius;

    & > :nth-child(odd) {
      background-color: rgba(128, 128, 255, 0.1);
    }
    & > * {
      border-bottom: 1px solid $gray2;
    }
    & > *:last-child {
      border-bottom: none;
    }
  }

  &__container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 2rem;
    min-width: 0;
    max-width: 64rem;
    margin: 0 auto;
    height: 100%;

    h2 {
      margin-top: 0;
    }

    h3 {
      font-size: 1.1rem;
      margin-top: 2.5rem;
    }
  }
}
</style>
