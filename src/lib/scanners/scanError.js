/**
 * Indicates that a scan has detected an illegal condition on an event.
 */
export default class ScanError extends Error {
  constructor(message, event) {
    super(message);
    this.event = event;
  }
}
