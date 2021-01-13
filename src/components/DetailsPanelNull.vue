<template>
  <div>
    <div id="intro-details" class="welcome">
      <div class="content">
        <div class="intro">
          <p>
            Select a component in the diagram to see its details here. Here, we’ll show you any
            relevant information about your code as you navigate through your appmaps.
          </p>
        </div>
        <div class="components_events">
          <h3>Components & Events</h3>
          <p>
            The UML-inspired diagrams display your key application components, and how they are
            inter-related during application execution.
          </p>
        </div>
        <div class="right_click">
          <h3>Right-click</h3>
          <p>Expand, collapse, and reset the diagram elements.</p>
        </div>
        <div class="filters">
          <h3>Filters</h3>
          <p>Bring focus to a narrow area of interest.</p>
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
#intro-details {
  color: $appland-text;
  font-size: .9rem;
  line-height: 1.2rem;
  padding: 0 2rem 2rem 2rem;
  h3 {
    color: $base03;
    margin-bottom: .25rem;
  }
  p {
    margin-top: 0;
  }
  .intro {
    img {
      max-width: 13rem;
      margin: 0 0 1.25rem 0;
    }
  }
  .legend {
    ul {
      padding: 0;
      list-style-type: none;
      li {
        display: flex;
        flex-direction: row;
        margin: .5rem 0;
        p {
          margin: 0;
        }
        align-items: flex-start;
      }
      .icon {
        display: inline-block;
        height: 1rem;
        width: 2rem;
        margin-right: .5rem;
        margin-top: .3rem;
        &.class-pkg {
          background-color: $teal;
        }
        &.class {
          background-color: $blue;
        }
        &.dynamic {
          background-image: url("../assets/arrow-right.svg");
          background-repeat: no-repeat;
        }
        &.web-service {
          background-color: $web-services;
        }
        &.database {
          background-color: $royal;
        }
      }
    }
  }
}
</style>
