<template>
  <div class="instructions">
    <button class="instructions__icon" type="button" @click="toggle">
      <InfoIcon />
    </button>
    <section class="instructions__container" v-if="isOpen">
      <div class="instructions__head">
        <h1 class="instructions__title">Welcome to your AppMap!</h1>
        <button class="instructions__close" @click="close">
          <CloseIcon />
        </button>
      </div>
      <div class="instructions__content">
        <div class="welcome">
          <p>
            UML-inspired diagrams display your key application components, and
            how they are inter-related during application execution.
          </p>
          <p>
            Select a node to see its details in the sidebar. Here, we’ll show
            you any relevant information about your code as you navigate through
            your appmaps.
          </p>
          <ul>
            <li>
              Right-click nodes to expand, collapse & reset the diagram elements
            </li>
            <li>Use filters to bring focus to a narrow area of interest</li>
          </ul>
          <div class="legend">
            <h4>Dependency map legend</h4>
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
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import CloseIcon from '../assets/close.svg';
import InfoIcon from '../assets/info.svg';

export default {
  name: 'v-instructions',
  components: {
    CloseIcon,
    InfoIcon,
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

    open() {
      this.isOpen = true;
    },

    close() {
      this.isOpen = false;
    },
  },
};
</script>

<style scoped lang="scss">
.instructions {
  position: relative;
  font-family: $appland-text-font-family;
  font-size: 0;
  z-index: 1000;

  &__icon,
  &__close {
    border: none;
    padding: 0.2rem;
    background: transparent;
    color: $gray4;
    font: inherit;
    font-size: 0.8rem;
    outline: none;
    line-height: 0;
    appearance: none;
    cursor: pointer;

    &:hover,
    &:active {
      color: $gray5;
    }

    svg {
      fill: currentColor;
    }
  }

  &__container {
    border-radius: $border-radius $border-radius 0 $border-radius;
    position: absolute;
    right: 0;
    bottom: 100%;
    display: flex;
    flex-direction: column;
    margin: 0 0.75rem 1rem 0;
    width: max-content;
    height: max-content;
    max-width: 30vw;
    max-height: 50vh;
    padding: 1.5rem;
    color: $gray6;
    background: $black;

    &::after {
      content: '';
      border: 0.5rem solid $black;
      border-left-color: transparent;
      border-bottom-color: transparent;
      display: block;
      position: absolute;
      right: 0;
      bottom: -0.8rem;
    }
  }

  &__head {
    position: relative;
    margin-bottom: 1rem;
    display: flex;
    align-items: flex-start;
  }

  &__title {
    margin: 0;
    color: $hotpink;
    font-size: 1.5rem;
  }

  &__content {
    font-size: 0.9rem;
    line-height: 1.2rem;
    word-break: break-word;
    overflow: auto;
  }

  &__close {
    margin-left: auto;
  }
}
.welcome {
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
