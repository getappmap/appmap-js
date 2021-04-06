import * as d3 from 'd3';
import deepmerge from 'deepmerge';

import momentum from '../momentum/index';
import { EventSource } from '../../../models';
import ContainerZoom from './zoom';
import ContextMenu from '../contextMenu/index';

const AVAILABLE_THEMES = ['light', 'dark'];
const DEFAULT_THEME = 'light';

const defaultOptions = {
  contextMenu: false,
  pan: {
    momentum: true, // if true, enables momentum on panning
    boundary: {
      contain: null, // selector for contained element
      overlap: 300, // px
    },
    tweenTime: 250, // ms
  },
  theme: DEFAULT_THEME,
  zoom: {
    controls: false, // display zoom controls (+ / - buttons)
    step: 0.1, // zoom step when clicking a button in the interface
    minRatio: 0.1, // minimum zoom scale
    maxRatio: 1.0, // maximum zoom scale
    requireActive: false, // whether or not the user must interact with the element before zooming
  },
};

const clamp = (x, min, max) => Math.min(Math.max(x, min), max);

// TODO
// Retire this class in favor of a Vue component
export default class Container extends EventSource {
  constructor(parent, options = {}, element = null, contentElement = null) {
    super();

    this.options = deepmerge(defaultOptions, options);
    this.scaleTarget = false;

    let { theme } = this.options;

    if (AVAILABLE_THEMES.indexOf(theme) === -1) {
      theme = DEFAULT_THEME;
    }

    this.element = element;
    if (!element) {
      this.element = document.createElement('div');
      this.element.className = `appmap appmap--theme-${theme}`;
    }

    this.contentElement = contentElement || document.createElement('div');
    this.contentElement.className = 'appmap__content';
    this.contentElement.containerController = this;

    if (!this.contentElement.parentElement) {
      this.element.appendChild(this.contentElement);
    }

    let parentElement = element;
    if (parent) {
      parentElement = d3.select(parent).node();
      parentElement.appendChild(this.element);
    }

    if (this.options.zoom) {
      if (this.options.zoom.controls) {
        this.zoomController = new ContainerZoom(this, this.options.zoom).on(
          'zoom',
          (k) => {
            const { minRatio, maxRatio } = this.options.zoom;
            const scaleLevel = (maxRatio - minRatio) * k + minRatio;

            if (this.scaleTarget && this.scaleTarget.x && this.scaleTarget.y) {
              this.scaleToAndTranslate(
                scaleLevel,
                this.scaleTarget.x,
                this.scaleTarget.y
              );
            } else {
              this.scaleTo(scaleLevel);
            }
            this.active = true;
          }
        );
      }

      this.zoom = d3
        .zoom()
        .scaleExtent([this.options.zoom.minRatio, this.options.zoom.maxRatio])
        .interpolate(d3.interpolate)
        .filter(() => {
          if (d3.event.type === 'wheel') {
            return this.active || !this.options.zoom.requireActive;
          }

          // Mutating state in a filter is not so great here. So far I've been
          // unsuccessful at binding a 'start' handler to do this. I'm all for
          // moving this mutation somewhere more appropriate if someone would
          // like to take the time to do so. -DB
          this.active = true;

          return true;
        })
        .on('zoom', () => {
          const { transform } = d3.event;

          const { offsetHeight, offsetWidth } = parentElement;

          transform.x = clamp(
            transform.x,
            (this.options.pan.boundary.overlap -
              this.contentElement.offsetWidth) *
              transform.k,
            offsetWidth - this.options.pan.boundary.overlap * transform.k
          );

          transform.y = clamp(
            transform.y,
            (this.options.pan.boundary.overlap -
              this.contentElement.offsetHeight) *
              transform.k,
            offsetHeight - this.options.pan.boundary.overlap * transform.k
          );

          this.contentElement.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`;
          this.contentElement.style.transformOrigin = '0 0';

          this.emit('move', transform);
        });

      if (this.options.pan.momentum) {
        momentum(this.zoom, d3.select(this.element));
      }

      d3.select(this.element).call(this.zoom).on('dblclick.zoom', null);
    }
  }

  setContextMenu(componentController) {
    if (
      this.options.contextMenu === false ||
      typeof this.options.contextMenu !== 'function'
    ) {
      return;
    }

    this.contextMenu = new ContextMenu(this.element);

    const contextMenuItems = this.options.contextMenu(componentController);

    contextMenuItems.forEach((item) => this.contextMenu.add(item));
  }

  fitViewport(targetElement) {
    const targetHeight = targetElement.offsetHeight;
    const targetWidth = targetElement.offsetWidth;
    const { clientWidth, clientHeight } = this.element.parentNode;
    const { minRatio, maxRatio } = this.options.zoom;
    const desiredRatio = Math.min(
      clientHeight / targetHeight,
      clientWidth / targetWidth
    );
    const initialScale = Math.max(
      Math.min(Math.max(desiredRatio, minRatio), maxRatio),
      0.8
    );
    const transformMatrix = d3.zoomIdentity
      .translate(
        (clientWidth - targetWidth * initialScale) * 0.5,
        (clientHeight - targetHeight * initialScale) * 0.5
      )
      .scale(initialScale);

    this.transform = transformMatrix;
  }

  centerX(verticalPadding = 0) {
    if (!this.element || !this.element.parentNode || !this.contentElement) {
      return;
    }

    const { offsetWidth: targetWidth } = this.contentElement;
    const { clientWidth } = this.element.parentNode;

    const transformMatrix = d3.zoomIdentity.translate(
      clientWidth * 0.5 - targetWidth * 0.5,
      verticalPadding
    );

    this.transform = transformMatrix;
  }

  translateTo(x, y, target = null) {
    d3.select(this.element)
      .transition()
      .duration(this.options.pan.tweenTime)
      .call(this.zoom.translateTo, x, y, target);
  }

  translateBy(x, y) {
    d3.select(this.element)
      .transition()
      .duration(this.options.pan.tweenTime)
      .call(this.zoom.translateBy, x, y);
  }

  scaleTo(k) {
    d3.select(this.element)
      .transition()
      .duration(100)
      .call(this.zoom.scaleTo, k);
  }

  scaleToAndTranslate(k, x, y) {
    d3.select(this.element)
      .transition()
      .duration(100)
      .call(this.zoom.scaleTo, k)
      .transition()
      .duration(this.options.pan.tweenTime)
      .call(this.zoom.translateTo, x, y, null);
  }

  get transform() {
    return d3.zoomTransform(this.element);
  }

  set transform(transform) {
    d3.select(this.element).call(this.zoom.transform, transform);
  }
}
