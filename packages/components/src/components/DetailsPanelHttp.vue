<template>
  <div>
    <v-details-panel-header :objectType="object.data.name" :object="object">
      <template v-slot:links>
        <v-details-button @click.native="setAsRoot">
          Set as Root
        </v-details-button>
      </template>
    </v-details-panel-header>
    <v-details-panel-list title="Routes" :items="object.children" />
  </div>
</template>

<script>
import VDetailsButton from '@/components/DetailsButton.vue';
import VDetailsPanelHeader from '@/components/DetailsPanelHeader.vue';
import VDetailsPanelList from '@/components/DetailsPanelList.vue';

export default {
  name: 'v-details-panel-http',
  components: {
    VDetailsButton,
    VDetailsPanelList,
    VDetailsPanelHeader,
  },
  props: {
    object: {
      type: Object,
      required: true,
    },
  },
  methods: {
    setAsRoot() {
      this.$root.$emit('makeRoot', this.object);
    },
  },
};
</script>

<style scoped lang="scss"></style>
