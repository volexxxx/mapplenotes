const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Align FoldersScreen Header
code = code.replace(
  /sticky top-0 pt-6 pb-2 px-4 flex flex-col border-b z-30 mb-2 w-full transition-all duration-1000 ease-\[[^\]]+\] \$\{glassEffect \? 'bg-white\/20 dark:bg-black\/20 border-white\/20 dark:border-white\/5 backdrop-blur-md shadow-sm' : 'border-gray-200 dark:border-\[#38383A\] bg-\[#F2F1F6\]\/80 dark:bg-\[#1C1C1E\]\/80 backdrop-blur-md'\}/g,
  "sticky top-0 h-16 px-4 flex items-center justify-between border-b z-30 w-full transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] shrink-0 ${glassEffect ? 'bg-white/20 dark:bg-black/20 border-white/20 dark:border-white/5 backdrop-blur-md shadow-sm' : 'border-black/5 dark:border-white/10 bg-[#F2F1F6]/80 dark:bg-[#1C1C1E]/80 backdrop-blur-md'}"
);
code = code.replace(
  /<\div className="flex justify-between items-center">\n\s*<h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">Folders<\/h2>\n\s*<\/div>/,
  '<h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">Folders</h2>'
);

// Align NotesScreen Header
code = code.replace(
  /sticky top-0 pt-6 pb-2 px-4 flex items-center justify-between z-30 w-full transition-all duration-1000 ease-\[[^\]]+\] \$\{glassEffect \? 'bg-white\/20 dark:bg-black\/20 border-b border-white\/20 dark:border-white\/10 backdrop-blur-md shadow-sm mb-0' : 'bg-white\/80 dark:bg-black\/80 backdrop-blur-md mb-2 border-transparent'\}/g,
  "sticky top-0 h-16 px-4 flex items-center justify-between border-b z-30 w-full transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] shrink-0 ${glassEffect ? 'bg-white/20 dark:bg-black/20 border-white/20 dark:border-white/5 backdrop-blur-md shadow-sm mb-0' : 'border-black/5 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-md mb-0'}"
);

// Align Editor Header
code = code.replace(
  /sticky top-0 pt-4 pb-2 px-4 flex items-center justify-between z-30 w-full transition-all duration-1000 ease-\[[^\]]+\] \$\{glassEffect \? 'bg-white\/20 dark:bg-black\/20 border-b border-white\/20 dark:border-white\/10 backdrop-blur-md shadow-sm mb-0' : 'bg-white\/80 dark:bg-black\/80 backdrop-blur mb-0 border-transparent'\}/g,
  "sticky top-0 h-16 px-4 flex items-center justify-between border-b z-30 w-full transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] shrink-0 ${glassEffect ? 'bg-white/20 dark:bg-black/20 border-white/20 dark:border-white/5 backdrop-blur-md shadow-sm mb-0' : 'border-black/5 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-md mb-0'}"
);

// Replace "Menu" text with Three Dots icon
code = code.replace(
  /<span className="text-sm font-semibold text-gray-900 dark:text-white">Menu<\/span>/,
  '<MoreHorizontal className="w-5 h-5 text-gray-900 dark:text-white relative z-10 drop-shadow-sm" strokeWidth={2} />'
);

// Change the accent color picker to unrestricted
code = code.replace(
  /<div className="flex justify-between items-center px-1">\n\s*\{\['#EEB111', '#0A84FF', '#28CD41', '#FF453A', '#BF5AF2'\].map[^\n]+\n\s*<button[^>]+>\s*onClick=\{\(e\) => \{[^}]+\}\}\n\s*className=[^>]+>\s*style=\{\{ backgroundColor: color \}\}\n\s*\/>\n\s*\)\)}\n\s*<\/div>/g,
  `<div className="flex justify-between items-center px-2">
      <input type="color" value={accentColor} onChange={(e) => {
          const color = e.target.value;
          setAccentColor(color);
          document.documentElement.style.setProperty('--app-accent', color);
          localStorage.setItem('accentColor', color);
      }} className="w-full h-10 rounded-xl cursor-pointer bg-transparent border-0 outline-none" />
   </div>`
);
// Above regex for the color buttons might be too complex, let me do a string replacement.
fs.writeFileSync('src/App.tsx', code);
