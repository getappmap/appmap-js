// @ts-check
const yaml = require('js-yaml');

const FgGreen = '\x1b[32m';
const FgBlue = '\x1b[34m';
const FgMagenta = '\x1b[35m';

const Buffer = 5;

function printAddedLine(line) {
  console.log(`%s+ %s\x1b[0m`, FgGreen, line);
}

function printChangedLine(line) {
  console.log(`%sm %s\x1b[0m`, FgBlue, line);
}

function printRemovedLine(line) {
  console.log(`%s- %s\x1b[0m`, FgMagenta, line);
}

/**
 * @param {import('./types').DiffEntry[]} diff
 */
function printTextDiff(diff) {
  let previousChangedSection = null;
  let previousUnchangedSection = null;
  diff.forEach((section) => {
    if (section.added) {
      if (
        previousUnchangedSection &&
        previousUnchangedSection.count > Buffer * 2
      ) {
        const lines = previousUnchangedSection.value.split('\n');
        console.log('...');
        console.log(
          lines
            .slice(lines.length - Buffer, lines.length)
            .map((l) => l.trim())
            .join('\n')
        );
      }
      console.log(`%s%s\x1b[0m`, FgGreen, section.value.trim());

      previousChangedSection = section;
      previousUnchangedSection = null;
    } else if (section.removed) {
      if (
        previousUnchangedSection &&
        previousUnchangedSection.count > Buffer * 2
      ) {
        const lines = previousUnchangedSection.value.split('\n');
        console.log('...');
        console.log(
          lines
            .slice(lines.length - Buffer, lines.length)
            .map((l) => l.trim())
            .join('\n')
        );
      }
      console.log(`%s%s\x1b[0m`, FgMagenta, section.value.trim());

      previousChangedSection = section;
      previousUnchangedSection = null;
    } else {
      if (previousChangedSection) {
        const lines = section.value.split('\n');
        console.log(
          lines
            .slice(0, Math.min(section.count, Buffer))
            .map((l) => l.trim())
            .join('\n')
        );
        if (section.count > Buffer * 2) {
          console.log('...');
        }
      }

      previousChangedSection = null;
      previousUnchangedSection = section;
    }
  });
}

/**
 * @param {import('./types').DiffEntry[]} diff
 * @param {import('./types').Format} format
 */
function printDiff(diff, format) {
  switch (format) {
    case 'yaml':
      console.log(yaml.dump(diff));
      break;
    case 'json':
      console.log(JSON.stringify(diff, null, 2));
      break;
    case 'text':
      printTextDiff(diff);
      break;
    default:
      throw new Error(`Invalid format: ${format}`);
  }
}

/**
 * @param {object} object
 * @param {import('./types').Format} format
 */
function printObject(object, format) {
  switch (format) {
    case 'text':
    case 'yaml':
      console.log(yaml.dump(object));
      break;
    case 'json':
      console.log(JSON.stringify(object, null, 2));
      break;
    default:
      throw new Error(`Invalid format: ${format}`);
  }
}

module.exports = {
  printAddedLine,
  printChangedLine,
  printRemovedLine,
  printDiff,
  printObject,
};
