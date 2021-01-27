<template>
  <div class="details-panel">
    <h3 class="details-panel__title">
      <img src="../assets/appland-logo.svg" />
    </h3>
    <div class="details-panel__content">
      <div class="details-panel__buttons">
        <slot name="buttons" />
      </div>
      <component :is="detailsType" :object="selectedObject" />
    </div>
  </div>
</template>

<script>
import VDetailsPanelClass from '@/components/DetailsPanelClass.vue';
import VDetailsPanelDatabase from '@/components/DetailsPanelDatabase.vue';
import VDetailsPanelEdge from '@/components/DetailsPanelEdge.vue';
import VDetailsPanelEvent from '@/components/DetailsPanelEvent.vue';
import VDetailsPanelFunction from '@/components/DetailsPanelFunction.vue';
import VDetailsPanelHttp from '@/components/DetailsPanelHttp.vue';
import VDetailsPanelNull from '@/components/DetailsPanelNull.vue';
import VDetailsPanelPackage from '@/components/DetailsPanelPackage.vue';
import VDetailsPanelRoute from '@/components/DetailsPanelRoute.vue';
import { Event } from '@/lib/models';

export default {
  name: 'v-details-panel',
  components: {
    VDetailsPanelClass,
    VDetailsPanelDatabase,
    VDetailsPanelEdge,
    VDetailsPanelEvent,
    VDetailsPanelFunction,
    VDetailsPanelHttp,
    VDetailsPanelNull,
    VDetailsPanelPackage,
    VDetailsPanelRoute,
  },
  props: {
    subtitle: String,
    selectedObject: {
      type: Object,
    },
  },

  computed: {
    detailsType() {
      let kind = 'null';
      window.e = Event;
      if (this.selectedObject && this.selectedObject.type) {
        kind = this.selectedObject.type;
      } else if (this.selectedObject instanceof Event) {
        kind = 'event';
      }

      return `v-details-panel-${kind}`;
    },
  },
};
</script>

<style scoped lang="scss">
.details-panel {
  display: inline-block;
  font-family: 'IBM Plex Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  min-width: 280px;
  width: 100%;
  height: 100%;
  color: $gray6;
  background-color: $vs-code-gray1;
  word-break: break-word;
  border-right: 1px solid $base15;
  overflow: scroll;

  &__title {
    padding: 2rem;
    margin: 0;
    img {
      max-width: 10rem;
    }
  }

  &__subtitle {
    margin-bottom: 1rem;
    color: $white;
  }

  &__content {
    padding: 0;
  }

  &__buttons {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
  }

  .clear-btn {
    display: inline-block;
    border: 1px solid lighten($gray3, 05);
    border-radius: $border-radius;
    margin-bottom: 1rem;
    margin-left: 2rem;
    padding: 0.25rem 0.6rem 0.25rem 0.5rem;
    letter-spacing: 0.5px;
    color: $gray4;
    text-transform: uppercase;
    font-size: 0.8rem;
    &:before {
      content: '✖ ';
    }
    &:hover {
      background-color: darken($vs-code-gray1, 03);
      border-color: darken($vs-code-gray1, 03);
    }
    &:focus {
      outline: none;
    }
  }

  .back-btn {
    display: inline-block;
    border: 1px solid $base15;
    border-radius: $border-radius;
    margin-bottom: 1rem;
    margin-left: 2rem;
    padding: 0.25rem 0.6rem 0.25rem 0.5rem;
    letter-spacing: 0.5px;
    color: $gray4;
    text-transform: uppercase;
    font-size: 0.8rem;
    &:before {
      content: '◄ ';
    }
    &:hover {
      background-color: darken($vs-code-gray1, 05);
      border-color: darken($vs-code-gray1, 03);
    }
  }
}
</style>
