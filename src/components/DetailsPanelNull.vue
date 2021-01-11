<template>
  <div class="details-panel-null">
    <div id="intro-details" class="welcome">
      <h3 class="block-heading">Welcome to AppLand!</h3>
      <div class="content intro">
        <p>Select a component in the diagram to see its details here. Here, we’ll show you any relevant information about your code as you navigate through your appmaps.</p>
        <p>Check the extension page for full details on what is possible with AppLand.</p>
        <div class="components_events">
          <h3>Components & Events</h3>
        <p>The UML-inspired diagrams display your key application components, and how they are inter-related during application execution.</p>
        </div>
        <div class="right_click">
          <h3>Right-click</h3>
          <p>Right-click nodes in the diagram to expand, collapse, and reset the diagram elements.</p>
        </div>
        <div class="filters">
          <h3>Filters</h3>
          <p>Use our powerful filters bring focus to a narrow area of youyr interest.</p>
        </div>
        <div class="legend">
          <ul>
            <li>
              <div class="icon class-pkg"></div>
              <p>Class packages. Right-click to expand them to classes.</p>
            </li>
            <li>
              <div class="icon class"></div>
              <p>Class. Right-click to see source (Ruby only)</p>
            </li>
            <li>
              <div class="icon dynamic"></div>
              <p>Dynamic dependencies</p>
            </li>
            <li>
              <div class="icon web-service"></div>
              <p>Web services/endpoints. Right-click to expand.</p>
            </li>
            <li>
              <div class="icon database"></div>
              <p>Databases that persist application data</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  name: 'v-details-panel-null',
};
</script>

<style scoped lang="scss">
.details-null {
}
</style>
