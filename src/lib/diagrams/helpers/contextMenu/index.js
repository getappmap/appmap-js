import { EventSource } from '../../../models';
import ContextMenuItem from './contextMenuItem';

function initializeDomElements(parent) {
  const dropdown = document.createElement('div');
  dropdown.classList.add('appmap__context-menu');
  dropdown.style.display = 'none';

  const dropdownMenu = document.createElement('div');
  dropdownMenu.classList.add('dropdown-menu');
  dropdown.appendChild(dropdownMenu);

  // Don't propagate mousedown events to elements we're above. For example, we
  // don't want the user being able to pan a viewport through this element.
  // OTOH, maybe this shouldn't be a class behavior and should be handled by the
  // context menu owner. If this causes issues in the future we can move this
  // out.
  dropdown.addEventListener('mousedown', (e) => e.stopPropagation());
  dropdown.addEventListener('pointerdown', (e) => e.stopPropagation());
  dropdown.addEventListener('touchstart', (e) => e.stopPropagation());

  const emptyMessage = document.createElement('p');
  emptyMessage.innerText = 'No actions available';
  emptyMessage.style.display = 'none';
  dropdownMenu.appendChild(emptyMessage);

  parent.appendChild(dropdown);

  return {
    dropdown,
    menu: dropdownMenu,
    emptyMessage,
  };
}

function addItem(contextMenu, item) {
  /* eslint-disable no-param-reassign */
  const itemElement = document.createElement('a');
  itemElement.classList.add('dropdown-item');
  itemElement.innerText = item.data.text;
  contextMenu.elements.menu.appendChild(itemElement);
  item.element = itemElement;

  return itemElement;
  /* eslint-enable no-param-reassign */
}

function addDivider(contextMenu) {
  const divider = document.createElement('div');
  divider.classList.add('dropdown-divider');
  contextMenu.elements.menu.appendChild(divider);
}

function transformElement(item, element) {
  if (typeof item.data.transform === 'function') {
    return item.data.transform(element);
  }
  return element;
}

function show(contextMenu, clickEvent) {
  /* eslint-disable no-param-reassign */
  let itemsDisplayed = 0;

  // Remove ancestors of the container element, we don't need to iterate any
  // further than that.
  const activeAreaIndex = clickEvent
    .composedPath()
    .findIndex((e) => e === contextMenu.activeArea);

  if (activeAreaIndex === -1) {
    return;
  }

  const path = clickEvent.composedPath().slice(0, activeAreaIndex + 1);

  contextMenu.items.forEach((item) => {
    const match = path.find((e) => item.match(e));
    if (!match) {
      item.element.style.display = 'none';
      return;
    }

    if (item.element.listener) {
      // make sure there's no old state
      item.element.removeEventListener('click', item.element.listener);
    }

    item.element.listener = () =>
      item.emit('execute', transformElement(item, match));
    item.element.addEventListener('click', item.element.listener);
    item.element.style.display = '';
    item.emit('show');
    itemsDisplayed += 1;
  });

  contextMenu.elements.emptyMessage.style.display =
    itemsDisplayed > 0 ? 'none' : '';

  const { x, y } = contextMenu.parent.getBoundingClientRect();
  contextMenu.elements.menu.style.transform = `translate(${
    clickEvent.x - x
  }px, ${clickEvent.y - y}px)`;
  contextMenu.elements.dropdown.style.display = 'block';
  /* eslint-enable no-param-reassign */
}

export default class ContextMenu extends EventSource {
  constructor(container, activeArea = null) {
    super();

    this.parent = container;
    this.activeArea = activeArea || container;
    this.elements = initializeDomElements(container);
    this.activeArea.addEventListener('contextmenu', (e) => {
      show(this, e);
      e.preventDefault();
      this.emit('show');
    });
    this.selectors = {};
    this.items = [];
  }

  divider() {
    addDivider(this);
    return this;
  }

  add(itemBuilder) {
    const item = itemBuilder(new ContextMenuItem());

    if (!item) {
      return this;
    }

    addItem(this, item);
    this.items.push(item);

    return this;
  }

  get visible() {
    if (!this.elements || !this.elements.menu) {
      return false;
    }

    return this.elements.menu.offsetWidth > 0;
  }

  close() {
    const isVisible = this.visible;
    if (isVisible) {
      this.elements.dropdown.style.display = 'none';
    }
    return isVisible;
  }

  // Determines whether or not an event could have originated from the context
  // menu.
  isEventSource(e) {
    if (!e) return false;

    const path = e.composedPath();

    if (!path || !this.elements) {
      return false;
    }

    return path.includes(this.elements.menu);
  }
}
