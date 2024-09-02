import EventEmitter from 'events';
import Message from '../message';

export interface TrajectoryEvent {
  type: 'sent' | 'received';
  message: Message;
  timestamp: Date;
}

export default class Trajectory extends EventEmitter {
  logSentMessage(message: Message) {
    const event: TrajectoryEvent = {
      type: 'sent',
      message,
      timestamp: new Date(),
    };
    this.emit('event', event);
  }

  logReceivedMessage(message: Message) {
    const event: TrajectoryEvent = {
      type: 'received',
      message,
      timestamp: new Date(),
    };
    this.emit('event', event);
  }
}
