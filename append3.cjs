const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `transition={{ type: 'spring', damping: 25, stiffness: 350 }}`;
const replacement = `transition={{ type: 'spring', damping: 20, stiffness: 250, mass: 0.8 }}`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
console.log('Appended color selector successfully!');
