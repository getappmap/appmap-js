<template>
  <div class="no-data-notice">
    <div class="notice">
      <p class="no-data-notice__title">Sorry, but there's no data to display :(</p>
      <ul class="why-me">
        <strong>Top 3 reasons why this appmap is empty:</strong>
        <li>appmap.yml did not list packages/modules/folders of your application logic</li>
        <li>
          If this AppMap was recorded from a test, the test did not provide sufficient coverage for
          good data
        </li>
        <li>
          If other manual method was used to record this AppMap, the instrumented code objects were
          not executed during the recording.
        </li>
      </ul>
      <p>
        Need assistance or have questions? Check our
        <a href="https://appmap.io/docs" target="_blank" rel="noopener noreferrer"> documentation</a
        >, or ask for help in
        <a href="https://appmap.io/slack" target="_blank" rel="noopener noreferrer"> Slack</a>.
      </p>
    </div>
    <v-diagram-gray class="empty-state-diagram" />
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import VDiagramGray from '@/assets/diagram-empty.svg';

export default {
  components: {
    VDiagramGray,
  },
};
</script>

<style lang="scss" scoped>
.no-data-notice {
  display: flex;
  position: absolute;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-family: $appland-text-font-family;
  line-height: 1.5;
  color: $base03;
  background-color: $black;
  z-index: 2147483647;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;

  .notice {
    display: flex;
    flex-direction: column;
    max-width: 60%;
    min-width: 16rem;
  }

  &__title {
    margin-bottom: 1rem;
    font-size: 2rem;
    font-weight: 700;
    background: linear-gradient(to right, $royal, $hotpink);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  a {
    color: $brightblue;
    text-decoration: none;

    &:hover,
    &:active {
      color: $brightblue;
    }
  }

  .empty-state-diagram {
    margin-top: 4rem;
  }

  .why-me {
    padding: 1rem;
    strong {
      margin-left: -1rem;
      color: $royal;
      margin-bottom: 0.5rem;
    }
  }
}
</style>
