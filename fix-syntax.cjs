const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `                ) : isFullScreen ? (
                   {sidebarVisible ? <PanelLeftClose className="w-5 h-5 text-gray-900 dark:text-white relative z-10 drop-shadow-sm" strokeWidth={2} /> : <PanelLeftOpen className="w-5 h-5 text-gray-900 dark:text-white relative z-10 drop-shadow-sm" strokeWidth={2} />}
                ) : (
                   <PanelLeftClose className="w-5 h-5 text-gray-900 dark:text-white relative z-10 drop-shadow-sm" strokeWidth={2} />
                )}`,
  `                ) : isFullScreen ? (
                   <PanelLeftOpen className="w-5 h-5 text-gray-900 dark:text-white relative z-10 drop-shadow-sm" strokeWidth={2} />
                ) : (
                   <PanelLeftClose className="w-5 h-5 text-gray-900 dark:text-white relative z-10 drop-shadow-sm" strokeWidth={2} />
                )}`
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed syntax error in Editor');
