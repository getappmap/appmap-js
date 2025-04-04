<template>
  <v-context-container
    :title="header"
    :uri="uri"
    :location="decodedLocation"
    :is-pinnable="isPinnable"
    :is-appliable="false"
    @pin="onPin"
  >
  </v-context-container>
</template>
<script lang="ts">
import VContextContainer from '@/components/chat/ContextContainer.vue';
import ContextItemMixin from '@/components/mixins/contextItem';
import Vue from 'vue';
import type { PinEvent } from './PinEvent';
import { URI } from '@appland/rpc';

export default Vue.extend({
  name: 'v-file',

  props: {
    title: String,
    uri: String,
    isPinnable: {
      type: Boolean,
      default: true,
    },
  },
  mixins: [ContextItemMixin],
  components: {
    VContextContainer,
  },
  computed: {
    header(): string | undefined {
      return this.decodedLocation.split(/[\\/]/).at(-1);
    },
    decodedLocation(): string {
      const uri = URI.parse(this.uri);
      return decodeURIComponent(uri.fsPath);
    },
  },
  methods: {
    onPin(evt: PinEvent) {
      // Receiving a "pin" here means that the user is unpinning the file, so evt.pinned is always
      // false.
      this.$root.$emit('pin', evt);
    },
  },
});
</script>
