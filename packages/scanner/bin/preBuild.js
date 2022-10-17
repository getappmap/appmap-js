const { mkdirSync } = require('fs');
const { copySync } = require('fs-extra');

mkdirSync('built', { recursive: true });
copySync('src/sampleConfig', 'built/sampleConfig');
