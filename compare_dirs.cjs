const fs = require('fs');
const path = require('path');

function getFiles(dir, base = '') {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const full = path.join(dir, item);
    const rel = path.join(base, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(getFiles(full, rel));
    } else {
      results.push(rel);
    }
  }
  return results;
}

const cFiles = new Set(getFiles('C:\\NanoPix'));
const dFiles = new Set(getFiles(path.join(__dirname, 'drivers', 'eighteeth_engine')));

console.log('Total files in C:\\NanoPix:', cFiles.size);
console.log('Total files in workspace drivers\\eighteeth_engine:', dFiles.size);

const missingInD = [];
for (const f of cFiles) {
  if (!dFiles.has(f)) missingInD.push(f);
}

console.log('Missing in workspace drivers\\eighteeth_engine:', missingInD.slice(0, 30));
