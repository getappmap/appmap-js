import type Conf from 'conf';
import { randomBytes, createHash } from 'crypto';

const SESSION_EXPIRATION = 1000 * 60 * 30; // 30 minutes

export class Session {
  private _id?: string;
  private _expiration?: number;

  get id(): string {
    if (!this.valid) this.renew();
    if (!this._id) throw new Error('Session ID is not set');
    return this._id;
  }

  get expiration(): number {
    if (!this.valid) this.renew();
    if (!this._expiration) throw new Error('Session expiration is not set');
    return this._expiration;
  }

  get valid(): boolean {
    return (
      this._id !== undefined &&
      this._expiration !== undefined &&
      !Session.beyondExpiration(this._expiration)
    );
  }

  constructor(private readonly config: Conf) {
    this.load();
  }

  static beyondExpiration(expiration: number): boolean {
    return expiration <= Date.now();
  }

  static expirationFromNow(): number {
    return Date.now() + SESSION_EXPIRATION;
  }

  static newSessionId(): string {
    return createHash('sha256').update(randomBytes(32)).digest('hex');
  }

  private load(): void {
    this._id = this.config.get('sessionId') as string | undefined;
    this._expiration = this.config.get('sessionExpiration') as number | undefined;
  }

  renew(): void {
    this._id = Session.newSessionId();
    this._expiration = Session.expirationFromNow();
    try {
      this.config.set({
        sessionId: this._id,
        sessionExpiration: this._expiration,
      });
    } catch (e) {
      const err = e as Error;
      // This can happen if the config file is not writable.
      console.warn(`Could not renew session: ${err.message}`);
    }
  }

  touch(): void {
    this._expiration = Session.expirationFromNow();
    try {
      this.config.set('sessionExpiration', this.expiration);
    } catch (e) {
      const err = e as Error;
      // This can happen if the config file is not writable.
      console.warn(`Could not update session: ${err.message}`);
    }
  }
}
