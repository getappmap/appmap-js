<template>
  <div class="instructions">
    <button class="instructions__icon" type="button" @click="toggle">
      <InfoSVG />
    </button>
    <div class="instructions__content" v-if="isOpen">
      <section class="welcome">
        <h1>Welcome to your AppMap!</h1>
        <p>
          The UML-inspired diagrams display your key application components, and
          how they are inter-related during application execution.
        </p>
        <p>
          Select a component in the diagram to see its details here. Here, we’ll
          show you any relevant information about your code as you navigate
          through your appmaps.
        </p>
        <ul>
          <li>
            Right-click nodes to expand, collapse & reset the diagram elements
          </li>
          <li>
            Our powerful filters bring focus to a narrow area of your interest
          </li>
        </ul>
        <div class="legend">
          <ul>
            <li>
              <div class="icon class-pkg"></div>
              <p>Class packages</p>
            </li>
            <li>
              <div class="icon class"></div>
              <p>Class</p>
            </li>
            <li>
              <div class="icon dynamic"></div>
              <p>Dynamic dependencies such as method calls or SQL queries</p>
            </li>
            <li>
              <div class="icon web-service"></div>
              <p>Web service endpoints/routes</p>
            </li>
            <li>
              <div class="icon database"></div>
              <p>Databases that persist app data</p>
            </li>
          </ul>
        </div>
      </section>
    </div>
    <div class="instructions__triangle" v-if="isOpen"></div>
  </div>
</template>

<script>
import InfoSVG from '../assets/info.svg';

export default {
  name: 'v-instructions',
  components: {
    InfoSVG,
  },

  data() {
    return {
      isOpen: false,
    };
  },

  methods: {
    toggle() {
      this.isOpen = !this.isOpen;
    },
  },
};
</script>

<style scoped lang="scss">
.instructions {
  position: relative;
  font-family: 'IBM Plex Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 0;
  z-index: 1000;

  &__icon {
    border: none;
    padding: 0.2rem;
    background: transparent;
    color: $gray4;
    font: inherit;
    font-size: 0.8rem;
    outline: none;
    line-height: 0;
    appearance: none;

    &:hover,
    &:active {
      color: $gray5;
    }

    svg {
      fill: currentColor;
    }
  }

  &__content {
    border-radius: $border-radius $border-radius 0 $border-radius;
    position: absolute;
    right: 0;
    bottom: 100%;
    margin: 0 0.75rem 1rem 0;
    width: max-content;
    max-width: 30vw;
    max-height: 50vh;
    padding: 1.5rem;
    font-size: 0.9rem;
    line-height: 1.2rem;
    color: $gray6;
    background: $black;
    word-break: break-word;
    overflow: auto;
  }

  &__triangle {
    border: 0.5rem solid $black;
    border-left-color: transparent;
    border-bottom-color: transparent;
    display: block;
    position: absolute;
    bottom: 100%;
    right: 0.75rem;
    margin-bottom: 0.2rem;
  }
}
.welcome {
  h1 {
    margin: 0 0 1rem;
    color: $hotpink;
    font-size: 1.5rem;
  }
  p {
    margin: 0 0 0.75rem;
  }
  ul {
    padding-left: 1rem;
    list-style: disc;
  }
  .legend {
    ul {
      margin: 0;
      padding: 0;
      list-style-type: none;
      li {
        display: flex;
        flex-direction: row;
        margin: 0.5rem 0;
        p {
          flex: 1;
          margin: 0;
        }
        align-items: flex-start;
      }
      .icon {
        display: inline-block;
        height: 1rem;
        width: 2rem;
        margin-right: 0.5rem;
        &.class-pkg {
          background-color: $teal;
        }
        &.class {
          background-color: $blue;
        }
        &.dynamic {
          background-image: url("data:image/svg+xml,%3Csvg width='32' height='12' viewBox='0 0 32 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M32 5.99999L22 0.226492L22 11.7735L32 5.99999ZM2.62268e-07 7L23 6.99999L23 4.99999L-2.62268e-07 5L2.62268e-07 7Z' fill='%23808B98'/%3E%3C/svg%3E%0A");
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
