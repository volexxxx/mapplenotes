const fs = require('fs');

function replaceColors(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\[#E6AF2E\]/g, 'accent');
  content = content.replace(/#E6AF2E/g, 'var(--app-accent)');
  content = content.replace(/\[#EEB111\]/g, 'accent');
  content = content.replace(/#EEB111/g, 'var(--app-accent)');
  content = content.replace(/\[#C99824\]/g, 'accent/80'); // replacing hover color
  content = content.replace(/#C99824/g, 'var(--app-accent)'); // replacing hover color
  fs.writeFileSync(file, content);
}

replaceColors('src/App.tsx');
replaceColors('src/StartScreen.tsx');
console.log('Replaced.');
