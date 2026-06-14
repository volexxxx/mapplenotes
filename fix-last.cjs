const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Restore limited colors
const oldColor = `<div className="flex gap-3 items-center">
                                  <input type="color" value={accentColor} onChange={(e) => {
                                     const color = e.target.value;
                                     setAccentColor(color);
                                     document.documentElement.style.setProperty('--app-accent', color);
                                     localStorage.setItem('accentColor', color);
                                  }} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 outline-none block p-0" />
                                  <span className="text-gray-900 dark:text-white font-medium text-sm">{accentColor.toUpperCase()}</span>
                               </div>`;
const newColor = `{['#EEB111', '#0A84FF', '#28CD41', '#FF453A', '#BF5AF2', '#FF9F0A', '#30D158'].map(color => (
                                  <button 
                                     key={color}
                                     onClick={(e) => { 
                                        e.stopPropagation(); 
                                        setAccentColor(color); 
                                        document.documentElement.style.setProperty('--app-accent', color);
                                        localStorage.setItem('accentColor', color);
                                     }}
                                     className={\`w-8 h-8 rounded-full transition-all duration-300 active:scale-95 \${accentColor === color ? 'bg-white dark:bg-black bg-opacity-20 backdrop-blur-md shadow-[0_0_0_2px_white,0_0_0_4px_var(--app-accent)] scale-[1.15]' : 'hover:scale-[1.15] shadow-sm ring-1 ring-black/5 dark:ring-white/10'}\`}
                                     style={{ backgroundColor: color }}
                                  />
                               ))}`;
code = code.replace(oldColor, newColor);

// 2. Enhance Settings display (glass effect)
code = code.replace(
  'className="relative w-full max-w-lg max-h-[90dvh] rounded-[2rem] bg-[#F2F1F6]/90 dark:bg-[#1C1C1E]/90 backdrop-blur-3xl saturate-[1.5] border border-white/40 dark:border-white/5 shadow-2xl flex flex-col pt-10 pb-8 px-8 overflow-y-auto"',
  'className="relative w-full max-w-lg max-h-[90dvh] rounded-[2rem] bg-white/70 dark:bg-[#111111]/70 backdrop-blur-[64px] saturate-[1.5] border border-white/40 dark:border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.3)] flex flex-col pt-10 pb-8 px-8 overflow-y-auto"'
);

// 3. Fix goal item margin
code = code.replace(/class="goal-item flex items-start gap-3 mb-2"/g, 'class="goal-item flex items-start gap-3 mb-[2px]"');
code = code.replace(/class="goal-item flex items-start gap-3 mb-1"/g, 'class="goal-item flex items-start gap-3 mb-[2px]"');

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed stuff');
