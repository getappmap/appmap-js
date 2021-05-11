<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png" />
    <h1>Welcome to Your Vue.js App</h1>
    <diagram-component />
  </div>
</template>

<script>
import DiagramComponent from '@/components/DiagramComponent.vue';

export default {
  name: 'App',
  components: { DiagramComponent },
};
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
  font-size: 16px;
}
</style>
