const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const anchor = 'GLASS EFFECT';

const insertStr = `
                          <div className="flex flex-col mt-4 mb-2">
                             <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">ACCENT COLOR</span>
                             <div className="flex justify-between items-center px-1">
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

const searchIndex = code.indexOf(anchor);
const btnEnd = code.indexOf('</button>', searchIndex) + '</button>'.length;
const divEnd = code.indexOf('</div>', btnEnd) + '</div>'.length;

const before = code.slice(0, divEnd);
const after = code.slice(divEnd);

fs.writeFileSync('src/App.tsx', before + insertStr + after);
console.log('Appended color selector successfully!');
