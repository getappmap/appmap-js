<template>
  <div class="message">
    <span>{{ message }}</span>
    <div class="options">
      <div class="option" v-if="limit > 0">
        <div class="option__grant center">Continue on the free plan</div>
        <p>The free plan allows you to send up to {{ limit }} messages to Navie AI per day.</p>
        <p>
          Please wait <b>{{ timeLeft }} </b>to send another message.
        </p>
      </div>
      <div class="option">
        <div class="option__grant center">Upgrade to AppMap Pro</div>
        <a href="https://appmap.io/pricing" class="center" target="_blank">See details</a>
        <p>AppMap Pro has no daily restriction on the number of daily messages sent to Navie AI.</p>
        <p>Upgrading will instantly restore access.</p>
        <a
          href="https://billing.stripe.com/p/login/14kcOoc0gbrIdqMeUU"
          class="center"
          target="_blank"
        >
          <v-button label="Subscribe" size="medium" class="subscribe" />
        </a>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import VButton from '@/components/Button.vue';

function pluralize(count: number, subject: string): string {
  return count === 1 ? subject : `${subject}s`;
}

export default Vue.extend({
  name: 'v-quota-exceeded-message',

  components: { VButton },

  props: {
    message: {
      default: '',
    },
    limit: {
      type: Number,
    },
    reset: {
      type: String,
    },
  },

  data() {
    return {
      now: new Date(),
      timer: undefined as ReturnType<typeof setInterval> | undefined,
    };
  },

  computed: {
    resetTime(): Date {
      return new Date(this.reset);
    },

    timeLeft(): string {
      const diff = this.resetTime.getTime() - this.now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor(diff / (1000 * 60) - hours * 60);

      if (!hours && !minutes) {
        return 'less than a minute';
      }

      return [
        hours ? `${hours} ${pluralize(hours, 'hour')}` : '',
        minutes ? `${minutes} ${pluralize(minutes, 'minute')}` : '',
      ]
        .filter(Boolean)
        .join(' and ');
    },
  },

  mounted() {
    this.timer = setInterval(() => {
      this.now = new Date();
    }, 1000);
  },

  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  },
});
</script>

<style lang="scss" scoped>
.message {
  padding-top: 2rem;
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: #ececec;
  margin-bottom: 3rem;

  .options {
    display: flex;
    flex-direction: row;
    justify-content: center;
    gap: 1rem;
    padding-top: 1rem;
  }

  a {
    color: #0097fa;
    text-decoration: none;

    &:hover {
      color: lighten(#0097fa, 10%);
      text-decoration: underline;
    }
  }
}

.option {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  text-align: start;

  background-color: rgba(0, 0, 0, 0.333);
  border-radius: $border-radius;
  color: #ececec;
  border: 1px solid rgba(0, 0, 0, 0.15);
  width: 33%;

  .center {
    text-align: center;
  }

  p {
    margin: 0;
  }

  &__grant {
    display: block;
    font-weight: 600;
    color: lighten($brightblue, 20%);
  }
  &__sub {
    display: block;
    font-size: 0.8rem;
    font-weight: 400;
  }
}

// .subscribe {
//   width: fit-content;
// }
</style>
