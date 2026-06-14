const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "style={{ overflowWrap: 'anywhere' }}",
  "style={{ overflowWrap: 'anywhere', fontSize: `${zoomLevel}%` }}"
);

fs.writeFileSync('src/App.tsx', content);
console.log('done replacing Editor style');
