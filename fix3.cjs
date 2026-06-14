const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                               {['#EEB111', '#0A84FF', '#28CD41', '#FF453A', '#BF5AF2'].map(color => (
                                  <button 
                                     key={color}
                                     onClick={(e) => { 
                                        e.stopPropagation(); 
                                        setAccentColor(color); 
                                        document.documentElement.style.setProperty('--app-accent', color);
                                        localStorage.setItem('accentColor', color);
                                     }}
                                     className={\`w-8 h-8 rounded-full transition-all duration-300 active:scale-95 \${accentColor === color ? 'bg-white dark:bg-black bg-opacity-20 backdrop-blur-md shadow-[0_0_0_2px_white,0_0_0_4px_var(--app-accent)] scale-110' : 'hover:scale-110 shadow-sm'}\`}
                                     style={{ backgroundColor: color }}
                                  />
                               ))}
                            </div>`;
const replace = `                               <div className="flex gap-3 items-center">
                                  <input type="color" value={accentColor} onChange={(e) => {
                                     const color = e.target.value;
                                     setAccentColor(color);
                                     document.documentElement.style.setProperty('--app-accent', color);
                                     localStorage.setItem('accentColor', color);
                                  }} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 outline-none block p-0" />
                                  <span className="text-gray-900 dark:text-white font-medium text-sm">{accentColor.toUpperCase()}</span>
                               </div>
                            </div>`;
code = code.replace(target, replace);
fs.writeFileSync('src/App.tsx', code);
