/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import EventEmitter from 'events';
import Message from '../message';

export interface TrajectoryEvent {
  type: 'sent' | 'received';
  message: Message;
  timestamp: Date;
}

class Trajectory extends EventEmitter {
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

interface Trajectory {
  on(event: 'event', listener: (event: TrajectoryEvent) => void): this;
  on(event: string, listener: (...args: unknown[]) => void): this;
}

export default Trajectory;
