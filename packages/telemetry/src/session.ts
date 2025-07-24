import type Conf from 'conf';
import { randomBytes, createHash } from 'crypto';

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
    return Date.now() + 1000 * 60 * 30;
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
    this.config.set('sessionId', this._id);
    this.config.set('sessionExpiration', this._expiration);
  }

  touch(): void {
    this._expiration = Session.expirationFromNow();
    this.config.set('sessionExpiration', this.expiration);
  }
}
