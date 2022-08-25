const sinon = require('sinon');

beforeEach(() => {
  try {
    if (!('calls' in console.log)) sinon.stub(console, 'log').returns();
    if (!('calls' in console.warn)) sinon.stub(console, 'warn').returns();
    if (!('calls' in console.error)) sinon.stub(console, 'error').returns();
  } catch (e) {
    console.error(e);
  }
});
