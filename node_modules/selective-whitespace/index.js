'use strict';

var tokenize = require('tokenize-whitespace');

// the values used by tokenize-whitespace
var types = {
	NEWLINE: 'LINEFEED',
	TAB: 'HORIZONTALTAB',
	SPACE: 'SPACE',
	CARRIAGE: 'CARRIAGERETURN',
	WORD: 'WORD'
};

module.exports = function (str, opts) {
	if (typeof str !== 'string') {
		throw new TypeError('selective-whitespace expects a string');
	}

	if (!opts) {
		return str.trim().replace(/\s{2,}/g, ' ');
	}

	var tokens = tokenize(str);

	var options = opts || {};
	var keep = options.keep ? options.keep.split(/,|\|/) : [];

	var stripAll = options.stripAll || false;
	var keepTabs = keep.indexOf('\t') !== -1;
	var keepNewline = keep.indexOf('\n') !== -1;
	var keepReturn = keep.indexOf('\r') !== -1;

	var allowedTokens = [];
	var string = '';

	tokens.map(function (token) {
		var type = token.type;

		var lastToken = getLastToken(allowedTokens);

		if (stripAll && type !== types.WORD) {
			return;
		}

		if (type === types.SPACE && (lastToken !== types.SPACE || lastToken === undefined)) {
			allowedTokens.push(type);
			string += token.text;
		} else if (keepTabs && type === types.TAB) {
			allowedTokens.push(type);
			string += token.text;
		} else if (keepNewline && type === types.NEWLINE) {
			allowedTokens.push(type);
			string += token.text;
		} else if (keepReturn && type === types.CARRIAGE) {
			allowedTokens.push(type);
			string += token.text;
		} else if (type === types.WORD) {
			allowedTokens.push(type);
			string += token.text;
		}

		// don't let space appear at the front
		if (allowedTokens.length === 1 && lastToken === types.SPACE) {
			allowedTokens = [];
			string = '';
		}
	});

	// strip the space at the end of the string
	if (string.substr(string.length - 1) === ' ') {
		return string.substr(0, string.length - 1);
	}
	return string;
};

function getLastToken(array) {
	if (array.length === 0) {
		return undefined;
	}
	return array[array.length - 1];
}
