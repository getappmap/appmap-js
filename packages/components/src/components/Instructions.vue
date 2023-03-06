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
      <div class="instructions__content welcome">
        <div class="intro">
          <p>
            These UML-inspired diagrams display your key application components, and how they are
            inter-related during application execution.
          </p>
          <ul>
            <li>
              When you first open an AppMap, we'll show you the maps we've created, as well as lists
              of labels and events we've identified in your code.
            </li>
            <li>When a node is selected, we'll show you its details in the sidebar.</li>
            <li>Use powerful filters bring focus to a narrow area of interest.</li>
          </ul>
        </div>
      </div>
      <section class="instructions-wrap">
        <div class="dependency-map" v-if="isViewingDependency">
          <h4>Dependency map</h4>
          <ul class="feature-list">
            <li>
              Right-click nodes to set as root, expand, collapse and reset the diagram elements
            </li>
            <li>Clicking an edge between nodes will display associated events</li>
          </ul>
          <ul class="legend">
            <h5>Legend</h5>
            <li>
              <div class="icon class-pkg"></div>
              <p>Class packages</p>
            </li>
            <li>
              <div class="icon class"></div>
              <p>Class / Function</p>
            </li>
            <li>
              <div class="icon dynamic"></div>
              <p>Dynamic dependencies such as method calls or SQL queries</p>
            </li>
            <li>
              <div class="icon web-service"></div>
              <p>HTTP requests</p>
            </li>
            <li>
              <div class="icon database"></div>
              <p>SQL queries</p>
            </li>
          </ul>
        </div>
        <div class="sequence" v-if="isViewingSequence">
          <h4>Sequence</h4>
          <ul class="feature-list">
            <li>Clicking an event will show details in left panel</li>
            <li>Expand and collapse sections</li>
            <li>Hide sequence diagram actors to optimize map</li>
          </ul>
          <ul class="legend">
            <h5>Legend</h5>
            <li><FromArrow />From arrow</li>
            <li><ReturnArrow />Return arrow</li>
            <li><LoopBox />Loop container</li>
            <li><CollapseSection />Collapse section</li>
            <li><ExpandSection />Expand section</li>
            <li><XIcon />Hide actor</li>
            <li><Lifeline />Lifeline</li>
            <li><LaneSeparator />Lane separator</li>
          </ul>
        </div>
        <div class="trace" v-if="isViewingTrace">
          <h4>Trace</h4>
          <ul class="feature-list">
            <li>&nbsp;Use arrow keys to navigate between nodes</li>
            <li>&nbsp;Expand nodes to see children</li>
          </ul>
          <ul class="legend">
            <h5>Legend</h5>
            <li class="type-int icon">Integer/Number</li>
            <li class="type-string icon">String</li>
            <li class="type-bool icon">Boolean</li>
            <li class="type-float icon">Float/Decimal</li>
            <li class="type-object icon">Object/Other</li>
          </ul>
        </div>
      </section>
    </section>
  </div>
</template>

<script>
import { VIEW_COMPONENT, VIEW_FLOW, VIEW_SEQUENCE } from '@/store/vsCode';
import CloseIcon from '../assets/close.svg';
import InfoIcon from '../assets/info.svg';
import CollapseSection from '../assets/sequence-legend/collapse-section.svg';
import ExpandSection from '../assets/sequence-legend/expand-section.svg';
import FromArrow from '../assets/sequence-legend/from-arrow.svg';
import ReturnArrow from '../assets/sequence-legend/return-arrow.svg';
import LoopBox from '../assets/sequence-legend/loop-box.svg';
import Lifeline from '../assets/sequence-legend/lifeline.svg';
import LaneSeparator from '../assets/sequence-legend/lane-separator.svg';
import XIcon from '@/assets/x-icon.svg';

export default {
  name: 'v-instructions',
  components: {
    CloseIcon,
    InfoIcon,
    CollapseSection,
    ExpandSection,
    FromArrow,
    ReturnArrow,
    LoopBox,
    XIcon,
    Lifeline,
    LaneSeparator,
  },

  props: {
    currentView: String,
  },

  data() {
    return {
      isOpen: false,
    };
  },

  computed: {
    isViewingDependency() {
      return this.currentView === VIEW_COMPONENT;
    },
    isViewingSequence() {
      return this.currentView === VIEW_SEQUENCE;
    },
    isViewingTrace() {
      return this.currentView === VIEW_FLOW;
    },
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
      width: 16px;
    }
  }

  &__container {
    border-radius: $border-radius $border-radius 0 $border-radius;
    position: absolute;
    right: 0;
    bottom: 100%;
    margin: 0 0.75rem 1rem 0;
    min-width: 30vw;
    height: max-content;
    max-width: 40vw;
    max-height: 80vh;
    padding: 1.5rem;
    color: $gray6;
    background: $black;
    overflow-y: auto;
  }

  &__head {
    position: relative;
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
ul {
  padding-left: 1rem;
  word-break: break-word;
  list-style-type: '\002D';
  list-style-position: inside;
  li {
    margin: 0.3rem 0;
  }
}
ul.feature-list {
  border-bottom: 1px solid $gray2;
  padding-left: 0;
  padding-bottom: 1rem;
  line-height: 1.3rem;
}

.instructions-wrap {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  column-gap: 2rem;
  overflow: auto;
  .legend {
    margin: 0;
    padding: 0;
    list-style-type: none;
    word-break: break-word;
    h5 {
      margin: 0 0 0.4rem 0;
      color: $gray2;
      font-size: 1rem;
      font-weight: 400;
    }
    li {
      display: flex;
      flex-direction: row;
      align-items: center;
      margin: 0.5rem 0;
      line-height: 2rem;
      gap: 0.5rem;
      font-size: 0.85rem;
      p {
        flex: 1;
        margin: 0;
        line-height: 1.5rem;
      }
    }
  }

  .dependency-map,
  .trace,
  .sequence {
    padding: 1rem;
    border-radius: $border-radius-big;
    border: 1px solid $gray2;
    width: 100%;
    font-size: 0.9rem;
    h4 {
      margin: 0;
      color: $hotpink;
      font-size: 1rem;
    }
    .legend {
      ul {
        margin: 0;
        padding: 0;
        list-style-type: none;
        li {
          display: flex;
          flex-direction: row;
          margin: 0;
          line-height: 2rem;
          p {
            flex: 1;
            margin: 0;
          }
          align-items: flex-start;
        }
      }
    }
  }

  .dependency-map {
    padding-right: 1.5rem;
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
        align-self: center;
      }
      &.web-service {
        background-color: $web-services;
      }
      &.database {
        background-color: $royal;
      }
    }
  }

  .trace {
    font-family: 'IBM Plex Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    .legend {
      li {
        line-height: 2rem;
        margin: 0;
      }
    }
    .icon {
      height: unset;
      width: unset;
      &.type-string:before,
      &.type-bool:before,
      &.type-float:before,
      &.type-object:before,
      &.type-int:before {
        font-size: 1.25rem;
        margin-right: 0.3rem;
        font-size: 2rem;
      }
      &.type-int {
        &:before {
          content: '●';
          color: $col-int;
        }
      }
      &.type-string {
        &:before {
          content: '●';
          color: $col-string;
        }
      }
      &.type-bool {
        &:before {
          content: '●';
          color: $col-bool;
        }
      }
      &.type-float {
        &:before {
          content: '●';
          color: $col-float;
        }
      }
      &.type-object {
        &:before {
          content: '●';
          color: $col-object;
        }
      }
    }
  }
}
@media (max-width: 1300px) {
  section.instructions-wrap {
    grid-template-columns: 1fr;
    .dependency-map {
      margin: 1rem 0;
    }
    .legend {
      margin-bottom: 1rem;
      &:last-of-type {
        margin-bottom: 0;
      }
    }
  }
}
</style>
