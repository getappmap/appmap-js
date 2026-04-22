import EventEmitter from 'events';

const eventBus = new EventEmitter();
eventBus.setMaxListeners(0);

export default eventBus;
