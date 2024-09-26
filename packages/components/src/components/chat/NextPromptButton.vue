<template>
  <v-button
    class="event-button"
    @click.shift.native="onSubmit"
    @click.exact.native="onChangeInput"
    size="small"
    kind="ghost"
  >
    <slot />
  </v-button>
</template>

<script lang="ts">
import Vue from 'vue';
import VButton from '../Button.vue';

export default Vue.extend({
  name: 'v-event-button',
  components: {
    VButton,
  },
  props: {
    command: {
      type: String,
      required: true,
    },
    prompt: {
      type: String,
      required: false,
    },
  },
  computed: {
    formattedCommand(): string {
      const command = this.command.toLowerCase();
      return command[0] === '@' ? command : `@${command}`;
    },
    formattedPrompt(): string {
      if (this.promptBeginsWithCommandVerb) {
        const [, ...rest] = this.prompt.split(/\s+/);
        return `${this.formattedCommand} ${rest.join(' ')}`;
      } else {
        return `${this.formattedCommand} ${this.prompt}`;
      }
    },
    promptBeginsWithCommandVerb(): boolean {
      let firstWord = this.prompt.split(/\s+/)[0].toLowerCase().replace(/^@/, '');
      return firstWord === this.command.toLowerCase().replace(/^@/, '');
    },
  },
  methods: {
    onSubmit(): void {
      this.$root.$emit('submit-prompt', this.formattedPrompt);
    },
    onChangeInput(): void {
      this.$root.$emit('change-input', this.formattedPrompt);
    },
  },
});
</script>

<style lang="scss" scoped>
.event-button {
  margin-right: 0.5rem;
}
</style>
