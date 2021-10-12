<template>
  <div class="details-panel-class">
    <v-details-panel-header
      object-type="Class"
      :object="object"
      :title="object.name"
    >
      <template v-slot:links>
        <v-details-button @click.native="viewSource">
          View source
        </v-details-button>
        <v-details-button @click.native="setAsRoot">
          Set as Root
        </v-details-button>
      </template>
    </v-details-panel-header>

    <v-details-panel-list
      title="Functions"
      :items="object.functions"
      nameKey="name"
    />
    <v-details-panel-list
      title="Inbound connections"
      :items="object.inboundConnections"
    />
    <v-details-panel-list
      title="Outbound connections"
      :items="outboundConnections"
    />
    <v-details-panel-list title="Queries" :items="queries" />
  </div>
</template>

<script>
import { CodeObjectType } from '@appland/models';
import VDetailsButton from '@/components/DetailsButton.vue';
import VDetailsPanelHeader from '@/components/DetailsPanelHeader.vue';
import VDetailsPanelList from '@/components/DetailsPanelList.vue';

export default {
  name: 'v-details-panel-class',
  components: {
    VDetailsButton,
    VDetailsPanelHeader,
    VDetailsPanelList,
  },

  props: {
    object: {
      type: Object,
      required: true,
    },
  },

  computed: {
    outboundConnections() {
      // Queries will appear in outbound connections, but we have a separate section for queries so
      // filter them out of this list
      return this.object.outboundConnections.filter(
        (obj) => obj.type !== CodeObjectType.QUERY
      );
    },

    queries() {
      // We don't currently have a panel for query objects.
      // Instead, link to the query events.
      return this.object.sqlQueries.map((obj) => obj.events).flat();
    },
  },

  methods: {
    viewSource() {
      this.$root.$emit('viewSource', this.object.locations[0]);
    },
    setAsRoot() {
      this.$root.$emit('makeRoot', this.object);
    },
  },
};
</script>

<style scoped lang="scss">
.details-panel-class {
  h4 {
    margin: 0;
    padding: 0.5rem 2rem;
    font-size: 1.3rem;
    border-bottom: 1px solid $gray3;
  }
  ul {
    list-style-type: none;
    padding: 0;
    margin: 0 0 1rem 0;
    width: 100%;
    li {
      width: 100%;
      border-bottom: 1px solid $gray3;
      padding: 0.5rem 0;
      transition: $transition;
      a {
        margin: 0 2rem;
        width: 100%;
      }
      &:hover {
        background-color: $blue;
        border-color: $blue;
        a {
          color: $white;
        }
      }
    }
  }
}
</style>
