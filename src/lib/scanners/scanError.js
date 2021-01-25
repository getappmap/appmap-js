export default class ScanError extends Error {
  constructor(message, event) {
    super(message);
    this.event = event;
  }
}
