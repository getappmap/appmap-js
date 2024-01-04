import Vue from 'vue';

type Data = {
  ownedElements: Set<HTMLAnchorElement>;
  clickHandler: (e: MouseEvent) => void;
};

// This is a global set of elements that we've already added a click handler to.
const listeningElements = new Set<HTMLAnchorElement>();

// This mixin emits a 'click-link' event when a link is clicked. The event
// contains the href of the link.
//
// This mixin is safe to use within nested components. It guarantees that only
// one click handler is registered per link.
export default Vue.extend({
  data(): Data {
    return {
      // This is the collection of elements that we've added a click handler to.
      // We're responsible for removing the click handler when the element is
      // updated or destroyed.
      ownedElements: new Set<HTMLAnchorElement>(),

      // A single stable function reference that we can use to add and remove
      // click handlers. This is initialized in `mounted`.
      clickHandler: () => {
        throw new Error('clickHandler not initialized');
      },
    };
  },

  methods: {
    onLinkClicked(e: MouseEvent) {
      const link = e.target;
      if (!(link instanceof HTMLAnchorElement)) return;

      // Ignore links that are internal to the page.
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#')) return;

      // Ignore links that aren't valid URLs.
      try {
        new URL(href);
      } catch (e) {
        return;
      }

      this.$root.$emit('click-link', href);
    },

    // If we own the element, remove the click handler and drop references.
    dropOwnership(el: HTMLAnchorElement) {
      if (!this.ownedElements.has(el)) return;

      this.ownedElements.delete(el);
      listeningElements.delete(el);
      el.removeEventListener('click', this.clickHandler);
    },

    // Attempt to take ownership of the element via adding the reference to
    // the global set. If it's already owned, this method returns false.
    // If the element is not already owned, add the click handler and return
    // true.
    takeOwnership(el: HTMLAnchorElement): boolean {
      if (listeningElements.has(el)) return false;

      this.ownedElements.add(el);
      listeningElements.add(el);
      el.addEventListener('click', this.clickHandler);

      return true;
    },

    // Drop all ownership and rebind click handlers to all elements.
    // Consider the case where a component is updated and the DOM is
    // re-rendered. We need to rebind the click handlers to the new
    // elements.
    rebindClickHandlers() {
      this.ownedElements.forEach((el) => this.dropOwnership(el));
      this.$el.querySelectorAll('a').forEach((el) => this.takeOwnership(el));
    },
  },

  mounted() {
    this.clickHandler = this.onLinkClicked.bind(this);
    this.rebindClickHandlers();
  },

  updated() {
    this.rebindClickHandlers();
  },
});
