'use strict';

module.exports = function(str){

    if (typeof str !== 'string'){
        throw new TypeError("You must supply a string");
    }

    // Unicode values to search for
    var unicodes = [9,10,11,12,13,32];

    var unicodeTokens = {
        9  : { text:'\t', type: 'HORIZONTALTAB',    length:1 },
        10 : { text:'\n', type: 'LINEFEED',         length:1 },
        11 : { text:'\v', type: 'VERTICALTAB',      length:1 },
        12 : { text:'\f', type: 'FORMFEED',         length:1 },
        13 : { text:'\r', type: 'CARRIAGERETURN',   length:1 },
        32 : { text:' ',  type: 'SPACE',            length:1 }
    };

    var tokens = [];
    var length = str.length;

    for(var i = 0; i < length; i++){

        var code = str.charCodeAt(i);
        var isWhitespace = unicodes.indexOf(code) !== -1;

        // Is this value a whitespace?
        if (isWhitespace){
            tokens.push(unicodeTokens[code]);
        } else {
            var wordtoken = getWordToken(str.substr(i));
            var len = wordtoken.length;
            tokens.push(wordtoken);
            i += (len - 1);
        }

    }

    return tokens;

};

// Extract whole word values
function getWordToken(str){
    var word = str.split(/\s/g)[0];
    return { text:word, type: 'WORD', length:word.length };
}