import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Used by the AutoComplete component
document.getSelection = jest.fn().mockReturnValue({ focusOffset: 0 });
