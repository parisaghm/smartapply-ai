const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '../dist/index.js');
const target = path.join(__dirname, '../dist/index.cjs');

if (fs.existsSync(source)) {
  fs.renameSync(source, target);
  console.log('Renamed index.js to index.cjs');
} else {
  console.error('dist/index.js not found');
  process.exit(1);
}

