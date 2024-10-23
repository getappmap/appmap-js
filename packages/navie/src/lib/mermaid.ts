import { JSDOM } from 'jsdom';
import type Mermaid from 'mermaid';

/* HACK: Make DOMPurify work in mermaid.

Mermaid uses DOMPurify which requires DOM.
DOMPurify does support passing window, but mermaid creates it on require in a
a way that prevents us from passing it; we need to put JSDOM's window
temporarily in the global object while we load mermaid.
*/
const realWindow = global.window;
(global as Record<string, unknown>)['window'] = new JSDOM().window;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mermaid = require('mermaid') as typeof Mermaid;

(global as Record<string, unknown>)['window'] = realWindow;

export default mermaid;
