const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace standard Goal HTML
const oldGoalPattern = /<div id="\$\{?id\}?" class="goal-item flex items-start gap-3 mb-1" data-completed="false">\s*<input type="checkbox" class="goal-checkbox mt-\[3px\] w-\[22px\] h-\[22px\] appearance-none rounded-full border border-gray-300 dark:border-gray-600 checked:bg-accent checked:border-accent relative flex-shrink-0 cursor-pointer transition-all after:content-\[''\] after:absolute after:hidden checked:after:block after:w-\[6px\] after:h-\[11px\] after:border-white after:border-r-2 after:border-b-2 after:rotate-45 after:left-\[7px\] after:top-\[3px\]" \/>\s*<span class="goal-text flex-1 outline-none text-lg transition-all duration-300"><br><\/span>\s*<\/div>/g;

const newGoalHTML = `<div id="\${id}" class="goal-item flex items-start gap-3 mb-2" data-completed="false">
        <input type="checkbox" class="goal-checkbox mt-[4px] w-5 h-5 appearance-none rounded-full border border-gray-300 dark:border-gray-600 checked:bg-accent checked:border-accent relative flex-shrink-0 cursor-pointer transition-all after:content-[''] after:absolute after:hidden checked:after:block after:w-[5px] after:h-[10px] after:border-white after:border-r-2 after:border-b-2 after:rotate-45 after:left-[6px] after:top-[2.5px]" />
        <span class="goal-text flex-1 outline-none transition-all duration-300"><br></span>
      </div>`;

// First replace the gen one:
code = code.replace(/<div id="goal-\$\{id\}" class="goal-item flex items-start gap-3 mb-1" data-completed="false">\s*<input[^>]+>\s*<span class="goal-text flex-1 outline-none text-lg transition-all duration-300"><br><\/span>\s*<\/div>/g, newGoalHTML);


// Also fix the Enter key gen one (id might be generated dynamically):
const enterGoalReplacement = `               const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
               const newGoalHTML = \`
                 <div id="goal-\${id}" class="goal-item flex items-start gap-3 mb-2" data-completed="false">
                   <input type="checkbox" class="goal-checkbox mt-[4px] w-5 h-5 appearance-none rounded-full border border-gray-300 dark:border-gray-600 checked:bg-accent checked:border-accent relative flex-shrink-0 cursor-pointer transition-all after:content-[''] after:absolute after:hidden checked:after:block after:w-[5px] after:h-[10px] after:border-white after:border-r-2 after:border-b-2 after:rotate-45 after:left-[6px] after:top-[2.5px]" />
                   <span class="goal-text flex-1 outline-none transition-all duration-300"><br></span>
                 </div>
               \`;`;

code = code.replace(/const id = Date\.now\(\)\.toString\(36\) \+ Math\.random\(\)\.toString\(36\)\.substr\(2\);\s*const newGoalHTML = `[\s\S]*?`;/m, enterGoalReplacement);

fs.writeFileSync('src/App.tsx', code);
