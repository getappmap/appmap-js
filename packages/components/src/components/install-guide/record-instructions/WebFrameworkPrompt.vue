<template>
  <div class="recording-method recording-method--disabled">
    <h3>
      <i class="header-icon header-icon--disabled"><RequestsIcon /></i>Requests recording
    </h3>
    <p>
      Did you know? When you run a {{ this.frameworks }} app, you can make AppMaps of all the HTTP
      requests served by your app. {{ this.frameworks }} wasn't detected in this project, though.
    </p>
  </div>
</template>
<script>
import RequestsIcon from '@/assets/request-arrows-icon.svg';

export default {
  name: 'WebFrameworkPrompt',

  props: {
    frameworks: Array,
  },
  components: { RequestsIcon },
};
</script>
