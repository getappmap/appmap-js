import { EventSource } from '../../../models';

// updateZoom updates the bar that indicates the current level of zoom.
// `zoomScale` is a float, ranging from 0.0 (fully zoomed in) to 1.0 (fully
// zoomed out)
function updateZoom(viewportZoom, zoomScale) {
  /* eslint-disable no-param-reassign */
  const { controls } = viewportZoom;
  if (!viewportZoom.maxZoomBarValue) {
    const zoomBarHeight = controls.zoomBar.getBoundingClientRect().height;
    const zoomGrabHeight = controls.zoomGrab.getBoundingClientRect().height;
    viewportZoom.maxZoomBarValue = zoomBarHeight - zoomGrabHeight;
  }

  const { maxZoomBarValue } = viewportZoom;
  const topOffset = maxZoomBarValue - maxZoomBarValue * zoomScale;
  viewportZoom.zoomScale = zoomScale;

  controls.zoomGrab.style.top = `${topOffset}px`;
  /* eslint-enable no-param-reassign */
}

/* eslint-disable no-param-reassign */
function createDOM(viewportZoom) {
  const controlsContainer = document.createElement('div');
  controlsContainer.className = 'appmap__zoom';

  const { controls } = viewportZoom;
  controls.buttonZoomIn = document.createElement('button');
  controls.buttonZoomIn.setAttribute('type', 'button');
  controls.buttonZoomIn.className = 'appmap__zoom-button';
  controls.buttonZoomIn.innerHTML = '&plus;';
  controlsContainer.appendChild(controls.buttonZoomIn);

  controls.zoomBar = document.createElement('div');
  controls.zoomBar.className = 'appmap__zoom-bar';
  controls.zoomGrab = document.createElement('div');
  controls.zoomGrab.className = 'appmap__zoom-grab';
  controls.zoomBar.appendChild(controls.zoomGrab);
  controlsContainer.appendChild(controls.zoomBar);

  controls.buttonZoomOut = document.createElement('button');
  controls.buttonZoomOut.setAttribute('type', 'button');
  controls.buttonZoomOut.className = 'appmap__zoom-button';
  controls.buttonZoomOut.innerHTML = '&minus;';
  controlsContainer.appendChild(controls.buttonZoomOut);

  viewportZoom.container.appendChild(controlsContainer);
  viewportZoom.element = controlsContainer;

  controls.buttonZoomIn.addEventListener('click', () => {
    viewportZoom.zoomScale = Math.min(
      1.0,
      viewportZoom.zoomScale + viewportZoom.step
    );
    viewportZoom.emit('zoom', viewportZoom.zoomScale);
  });

  controls.buttonZoomOut.addEventListener('click', () => {
    viewportZoom.zoomScale = Math.max(
      0.0,
      viewportZoom.zoomScale - viewportZoom.step
    );
    viewportZoom.emit('zoom', viewportZoom.zoomScale);
  });

  controls.zoomBar.addEventListener('click', (event) => {
    if (event.target !== controls.zoomBar) {
      return false;
    }

    const maxOffset = controls.zoomBar.getBoundingClientRect().height;
    const offset =
      event.clientY - Math.round(controls.zoomBar.getBoundingClientRect().top);

    viewportZoom.emit('zoom', 1.0 - offset / maxOffset);

    return true;
  });

  controls.zoomBar.addEventListener('mousedown', (event) => {
    document.body.style.cursor = 'grabbing';
    viewportZoom.zoomGrabPosition = controls.zoomGrab.offsetTop;
    viewportZoom.dragStart = event.clientY;
    viewportZoom.isDragging = true;
    event.stopPropagation();
  });

  document.body.addEventListener('mousemove', (event) => {
    if (viewportZoom.isDragging) {
      const maxOffset = controls.zoomBar.getBoundingClientRect().height;
      const offset =
        viewportZoom.zoomGrabPosition +
        (event.clientY - viewportZoom.dragStart);
      viewportZoom.emit('zoom', 1.0 - offset / maxOffset);
      event.preventDefault();
    }
  });

  document.body.addEventListener('mouseup', () => {
    document.body.style.cursor = null;
    viewportZoom.isDragging = false;
  });
}
/* eslint-enable no-param-reassign */

export default class ContainerZoom extends EventSource {
  constructor(container, options) {
    super();

    this.container = container.element;
    this.step = options.step;
    this.controls = {};
    this.maxZoomBarValue = null;
    this.dragStart = null;
    this.zoomGrabPosition = null;
    this.isDragging = false;
    this.zoomGrabTimeout = null;

    createDOM(this);
    updateZoom(this, container.transform.k);
    container.on('move', (transform) =>
      updateZoom(
        this,
        (transform.k - options.minRatio) / (options.maxRatio - options.minRatio)
      )
    );
  }
}
