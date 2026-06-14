const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                       <div className="px-4 py-3 border-b border-gray-200/50 dark:border-white/10 mb-1">
                          <div className="flex items-center justify-between mb-3">
                             <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">GLASS EFFECT</span>
                             <button onClick={(e) => { e.stopPropagation(); setGlassEffect(!glassEffect); }} className={\`relative w-10 h-6 rounded-full transition-colors duration-300 \${glassEffect ? 'bg-accent' : 'bg-gray-300 dark:bg-gray-600'}\`}>
                                <motion.div layout transition={{ type: "spring", stiffness: 700, damping: 30 }} className="absolute text-center flex items-center justify-center top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm" style={{ x: glassEffect ? 16 : 0 }} />
                             </button>
                          </div>
                       </div>`;

const replacement = target + `
                       
                       <div className="px-4 py-3 border-b border-gray-200/50 dark:border-white/10 mb-1">
                          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 block">ACCENT COLOR</span>
                          <div className="flex justify-between items-center">
                             {['#EEB111', '#0A84FF', '#28CD41', '#FF453A', '#BF5AF2'].map(color => (
                                <button
                                   key={color}
                                   onClick={(e) => {
                                      e.stopPropagation();
                                      setAccentColor(color);
                                      document.documentElement.style.setProperty('--app-accent', color);
                                      localStorage.setItem('accentColor', color);
                                   }}
                                   className={\`w-6 h-6 rounded-full transition-transform hover:scale-110 active:scale-95 \${accentColor === color ? 'ring-2 ring-offset-2 ring-offset-white/30 dark:ring-offset-white/5 ring-gray-400 dark:ring-gray-500 shadow-md scale-110' : ''}\`}
                                   style={{ backgroundColor: color }}
                                />
                             ))}
                          </div>
                       </div>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
console.log('Done.');
