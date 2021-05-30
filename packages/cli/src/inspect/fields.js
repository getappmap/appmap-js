const FIELDS = [
  { name: 'eventMatches', title: 'Events' },
  {
    name: 'returnValues',
    filterName: 'returnValue',
    title: 'Return values',
    valueTitle: 'Value',
  },
  {
    name: 'httpServerRequests',
    filterName: 'httpServerRequest',
    title: 'HTTP server requests',
    valueTitle: 'Route',
  },
  {
    name: 'sqlQueries',
    title: 'SQL queries',
    valueTitle: 'Query',
  },
  {
    name: 'sqlTables',
    title: 'SQL tables',
    valueTitle: 'Table',
  },
  {
    name: 'callers',
    filterName: 'caller',
    title: 'Callers',
    valueTitle: 'Name',
  },
  {
    name: 'ancestors',
    filterName: 'ancestor',
    title: 'Ancestors',
    valueTitle: 'Name',
  },
  { name: 'descendants', title: 'Descendants', valueTitle: 'Name' },
  { name: 'classTrigrams', title: 'Class trigrams' },
  { name: 'functionTrigrams', title: 'Function trigrams' },
];

const Fields = {};

Fields.fields = FIELDS;

Fields.indexFromName = (name) => {
  for (let index = 0; index < FIELDS.length; index += 1) {
    if (FIELDS[index].name === name) {
      return index;
    }
  }
  throw new Error(`Invalid field name: ${name}`);
};

Fields.selectIndexes = (names) => {
  // eslint-disable-next-line no-param-reassign
  names = new Set([...names]);
  return FIELDS.map((f, index) => (names.has(f.name) ? index : null)).filter(
    (index) => index !== null
  );
};

Fields.fieldFromIndex = (index) => FIELDS[index];

module.exports = Fields;
