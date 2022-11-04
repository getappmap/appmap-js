<template>
  <div class="code-object-header">
    <h4 class="code-object-header__details-type">
      {{ codeObject.name }}
    </h4>

    <div class="v-details-panel-list">
      <h5>Events</h5>
      <ul>
        <li class="list-item" v-for="item in codeObject.events">
          <span
            class="list-item__event-quickview"
            v-if="eventQuickview"
            @click.stop="focusEvent(item)"
            title="View event in Trace view"
          >
            {{ item }}
          </span>
        </li>
      </ul>
    </div>

    <div class="v-details-panel-list">
      <h5>Return values</h5>
      <ul>
        <li class="list-item" v-for="item in codeObject.returnValues">
          {{ item }}
        </li>
      </ul>
    </div>

    <div class="v-details-panel-list">
      <h5>HTTP server requests</h5>
      <ul>
        <li class="list-item" v-for="item in codeObject.httpServerRequests">
          {{ item }}
        </li>
      </ul>
    </div>

    <div class="v-details-panel-list">
      <h5>SQL queries</h5>
      <ul>
        <li class="list-item" v-for="item in codeObject.sqlQueries">
          {{ item }}
        </li>
      </ul>
    </div>

    <div class="v-details-panel-list">
      <h5>SQL tables</h5>
      <ul>
        <li class="list-item" v-for="item in codeObject.sqlTables">
          {{ item }}
        </li>
      </ul>
    </div>

    <div class="v-details-panel-list">
      <h5>Class trigrams</h5>
      <ul>
        <li class="list-item" v-for="item in codeObject.classTrigrams">
          {{ item }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: 'VCodeObject',
  components: {},
  props: {
    codeObject: {
      type: Object,
      required: true,
    },
  },
};
</script>

<style scoped lang="scss"></style>
