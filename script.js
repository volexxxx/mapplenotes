const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/duration-1000/g, 'duration-500');
fs.writeFileSync('src/App.tsx', code);
