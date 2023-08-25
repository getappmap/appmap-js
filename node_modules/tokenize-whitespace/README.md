# tokenize-whitespace [![Build Status](https://travis-ci.org/radiovisual/tokenize-whitespace.svg)](https://travis-ci.org/radiovisual/tokenize-whitespace)

> Tokenize a string into words and whitespace tokens

## Installation

```
$ npm install --save tokenize-whitespace
```

## Usage

```js
var tokenizeWhiteSpace = require('tokenize-whitespace');

var str = '\tString \nwith \nwhitespace \rchars';

// Get an Array of tokens
tokenizeWhitespace(str);
```

Output:

```js
[ { text: '\t',         type: 'HORIZONTALTAB',  length: 1  },
  { text: 'String',     type: 'WORD',           length: 6  },
  { text: ' ',          type: 'SPACE',          length: 1  },
  { text: '\n',         type: 'LINEFEED',       length: 1  },
  { text: 'with',       type: 'WORD',           length: 4  },
  { text: ' ',          type: 'SPACE',          length: 1  },
  { text: '\n',         type: 'LINEFEED',       length: 1  },
  { text: 'whitespace', type: 'WORD',           length: 10 },
  { text: ' ',          type: 'SPACE',          length: 1  },
  { text: '\r',         type: 'CARRIAGERETURN', length: 1  },
  { text: 'chars',      type: 'WORD',           length: 5  } 
]
```

## Relevant Whitespace

Currently, this module only tokenizes the following whitespace characters:
- `HORIZONTALTAB` => `'\t'`
- `LINEFEED` => `'\n'`
- `VERTICALTAB` => `'\v'`
- `FORMFEED` => `'\f'`
- `CARRIAGERETURN` => `'\r'`
- `SPACE` => `' '`

Please [open an issue](https://github.com/radiovisual/tokenize-whitespace/issues) or [submit a pull request](https://github.com/radiovisual/tokenize-whitespace/compare?expand=1) if you would like to see more whitespace character support.

## License 

MIT @ [Michael Wuergler](http://numetriclabs.com)