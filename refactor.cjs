const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove duplicate Panel toggle from FoldersScreen
// In FoldersScreen:
// <button onClick={onToggleSidebar} className="relative flex items-center justify-center w-10 h-10 rounded-full ...">
//    <PanelLeftClose className="w-5 h-5 ..."/>
// </button>
content = content.replace(
  /<button onClick=\{onToggleSidebar\} className="relative flex items-center justify-center w-10 h-10 rounded-full[^\>]+>\s*<PanelLeftClose className="w-5 h-5[^>]+>\s*<\/button>/,
  ""
);

// 2. Make the panel toggle in NotesScreen dynamic based on sidebarVisible
// In NotesScreen:
// <PanelLeftOpen className="w-5 h-5 text-gray-900 dark:text-white relative z-10 drop-shadow-sm" strokeWidth={2} />
content = content.replace(
  /<PanelLeftOpen className="w-5 h-5 text-gray-900 dark:text-white relative z-10 drop-shadow-sm" strokeWidth=\{2\} \/>/g,
  `{sidebarVisible ? <PanelLeftClose className="w-5 h-5 text-gray-900 dark:text-white relative z-10 drop-shadow-sm" strokeWidth={2} /> : <PanelLeftOpen className="w-5 h-5 text-gray-900 dark:text-white relative z-10 drop-shadow-sm" strokeWidth={2} />}`
);

// 3. Fix FoldersScreen new folder button + duplicate create note
// Remove the SquarePen button:
content = content.replace(
  /<button onClick=\{onCreate\} className="p-1 text-accent hover:text-accent\/80 transition-colors"><SquarePen className="w-6 h-6" \/><\/button>/,
  ""
);
// Replace folder button with circle glass design:
content = content.replace(
  /<button onClick=\{[^\}]+\} className="flex items-center text-accent text-sm font-medium hover:text-accent\/80 transition-colors">\s*<FolderPlus className="w-5 h-5 mr-1.5" \/> New Folder\s*<\/button>/,
  `<button onClick={() => setIsCreating(true)} className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-3xl shadow-sm border border-white/40 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/10 active:scale-95 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group text-accent">
      <FolderPlus className="w-5 h-5 relative z-10 drop-shadow-sm" />
  </button>`
);

// 4. Transform showMenu into a full screen glass panel / slide drawer
const menuDropdownStr = `{showMenu && (
                <>
                   <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                   <motion.div initial={{ opacity: 0, y: -30, scale: 0.8, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -20, scale: 0.9, filter: 'blur(4px)' }} transition={{ type: 'spring', damping: 25, stiffness: 450, mass: 0.6 }} className="absolute top-14 right-0 w-64 bg-white/40 dark:bg-black/70 backdrop-blur-[40px] saturate-[1.5] border border-white/50 dark:border-white/10 shadow-[0_16px_64px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.5)] rounded-3xl p-3 z-50 flex flex-col gap-2">
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/40 via-white/5 to-white/10 dark:from-white/10 dark:via-transparent dark:to-white/5 rounded-3xl pointer-events-none" />
                      <button onClick={(e) => { e.stopPropagation(); onToggleTheme(); }} className="relative w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white bg-white/30 dark:bg-black/30 backdrop-blur-md hover:bg-white/50 dark:hover:bg-black/50 overflow-hidden group transition-all duration-300 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_2px_8px_rgba(0,0,0,0.05)] border border-white/50 dark:border-white/10 active:scale-95">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/10 rounded-xl opacity-50 pointer-events-none" />
                        <span className="relative z-10 drop-shadow-sm">Change Theme</span>
                        <div className="relative z-10 w-7 h-7 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 shadow-inner group-hover:rotate-12 transition-transform duration-500">
                           {theme === 'light' ? <Sun className="w-4 h-4 text-orange-500 drop-shadow-md" /> : <Moon className="w-4 h-4 text-blue-300 drop-shadow-md" />}
                        </div>
                      </button>
                      
                      <div className="px-4 py-3 border-t border-b border-gray-200/50 dark:border-white/10 my-1">
                         <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest drop-shadow-sm shadow-white/30">FONT SIZE</span>
                            <span className="text-xs font-semibold text-gray-900 dark:text-white bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-md backdrop-blur-sm border border-black/5 dark:border-white/5">{zoomLevel}%</span>
                         </div>
                         <div className="relative p-2 bg-white/30 dark:bg-black/30 backdrop-blur-md rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_2px_8px_rgba(0,0,0,0.05)] border border-white/50 dark:border-white/10 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/10 opacity-50 pointer-events-none" />
                            <input 
                               type="range" 
                               min="75" 
                               max="150" 
                               value={zoomLevel || 100} 
                               onChange={(e) => onZoomChange(Number(e.target.value))} 
                               className="relative z-10 w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent drop-shadow-sm"
                            />
                         </div>
                      </div>

                      <div className="px-4 py-3 border-b border-gray-200/50 dark:border-white/10 mb-1">
                         
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
                          </div>
                      </div>

                      {user ? (
                         <button onClick={() => { logOut(); localStorage.removeItem('guestMode'); window.location.reload(); setShowMenu(false); }} className="relative w-full flex items-center px-4 py-2.5 text-sm font-medium text-red-500 bg-white/30 dark:bg-black/30 backdrop-blur-md hover:bg-white/50 dark:hover:bg-black/50 overflow-hidden group transition-all duration-300 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_2px_8px_rgba(0,0,0,0.05)] border border-white/50 dark:border-white/10 active:scale-95 mt-1">
                           <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/10 rounded-xl opacity-50 pointer-events-none" />
                           <LogOut className="w-4 h-4 mr-2 relative z-10 drop-shadow-sm" /> 
                           <span className="relative z-10 drop-shadow-sm">Sign Out & Exit to Start</span>
                         </button>
                      ) : (
                        <>
                           <button onClick={() => { signIn(); setShowMenu(false); }} className="relative w-full flex items-center px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white bg-white/30 dark:bg-black/30 backdrop-blur-md hover:bg-white/50 dark:hover:bg-black/50 overflow-hidden group transition-all duration-300 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_2px_8px_rgba(0,0,0,0.05)] border border-white/50 dark:border-white/10 active:scale-95 mt-1">
                              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/10 rounded-xl opacity-50 pointer-events-none" />
                              <LogIn className="w-4 h-4 mr-2 relative z-10 drop-shadow-sm" /> 
                              <span className="relative z-10 drop-shadow-sm">Sign In</span>
                           </button>
                           <button onClick={() => { localStorage.removeItem('guestMode'); window.location.reload(); }} className="relative w-full flex items-center px-4 py-2.5 text-sm font-medium text-red-500 bg-white/30 dark:bg-black/30 backdrop-blur-md hover:bg-white/50 dark:hover:bg-black/50 overflow-hidden group transition-all duration-300 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_2px_8px_rgba(0,0,0,0.05)] border border-white/50 dark:border-white/10 active:scale-95 mt-1">
                              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/10 rounded-xl opacity-50 pointer-events-none" />
                              <LogOut className="w-4 h-4 mr-2 relative z-10 drop-shadow-sm" /> 
                              <span className="relative z-10 drop-shadow-sm">Exit to Start</span>
                           </button>
                        </>
                      )}
                   </motion.div>
                </>
             )}`;

const newMenuDrawerStr = `{showMenu && createPortal(
                <div className="fixed inset-0 z-[100] flex justify-end">
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowMenu(false)} />
                   <motion.div 
                      initial={{ x: '100%', opacity: 0, scale: 0.95 }} 
                      animate={{ x: 0, opacity: 1, scale: 1 }} 
                      exit={{ x: '100%', opacity: 0, scale: 0.95 }} 
                      transition={{ type: 'spring', damping: 30, stiffness: 350, mass: 0.8 }} 
                      className="relative w-80 max-w-[85vw] h-full bg-white/50 dark:bg-black/50 backdrop-blur-[48px] saturate-[1.5] border-l border-white/40 dark:border-white/10 shadow-[-10px_0_30px_rgba(0,0,0,0.1)] flex flex-col pt-16 pb-8 px-6 overflow-y-auto"
                   >
                      <button onClick={() => setShowMenu(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/20 active:scale-95 backdrop-blur-md transition-all"><X className="w-5 h-5 text-gray-900 dark:text-white" /></button>
                      
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 tracking-tight drop-shadow-sm">Settings</h2>
                      
                      <div className="flex flex-col space-y-6">
                         
                         {/* Theme */}
                         <div>
                            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1 mb-2 block">Appearance</span>
                            <button onClick={(e) => { e.stopPropagation(); onToggleTheme(); }} className="relative w-full flex items-center justify-between px-5 py-3.5 text-[15px] font-medium text-gray-900 dark:text-white bg-white/60 dark:bg-[#2C2C2E]/60 backdrop-blur-xl hover:bg-white/80 dark:hover:bg-[#2C2C2E]/80 overflow-hidden group transition-all duration-300 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.6)] border border-white/60 dark:border-white/10 active:scale-95">
                              <span className="relative z-10">Theme</span>
                              <div className="relative z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-black/30 shadow-inner group-hover:rotate-12 transition-transform duration-500">
                                 {theme === 'light' ? <Sun className="w-4 h-4 text-orange-500" strokeWidth={2.5} /> : <Moon className="w-4 h-4 text-blue-400" strokeWidth={2.5} />}
                              </div>
                            </button>
                         </div>

                         {/* Font Size */}
                         <div>
                            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1 mb-2 block">Text Size</span>
                            <div className="relative bg-white/60 dark:bg-[#2C2C2E]/60 backdrop-blur-xl rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.6)] border border-white/60 dark:border-white/10 p-1 flex">
                               {[ {label: 'S', val: 85}, {label: 'M', val: 100}, {label: 'L', val: 120} ].map(sz => (
                                 <button
                                    key={sz.label}
                                    onClick={() => onZoomChange(sz.val)}
                                    className={\`flex-1 py-2 rounded-xl text-[15px] font-semibold transition-all duration-300 \${zoomLevel === sz.val ? 'bg-white dark:bg-[#48484A] text-accent shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-white/5'}\`}
                                 >{sz.label}</button>
                               ))}
                            </div>
                         </div>

                         {/* Accent Color */}
                         <div>
                            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1 mb-3 block">Accent Color</span>
                            <div className="flex justify-between items-center px-2">
                               {['#EEB111', '#0A84FF', '#28CD41', '#FF453A', '#BF5AF2'].map(color => (
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
                            </div>
                         </div>
                         
                         <div className="h-px w-full bg-black/5 dark:bg-white/10 my-2"></div>

                         {/* Account Actions */}
                         <div>
                            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1 mb-2 block">Account</span>
                            <div className="flex flex-col gap-2">
                            {user ? (
                               <button onClick={() => { logOut(); localStorage.removeItem('guestMode'); window.location.reload(); setShowMenu(false); }} className="relative w-full flex items-center px-5 py-3.5 text-[15px] font-medium text-red-500 bg-white/60 dark:bg-[#2C2C2E]/60 backdrop-blur-xl hover:bg-white/80 dark:hover:bg-[#2C2C2E]/80 overflow-hidden group transition-all duration-300 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.6)] border border-white/60 dark:border-white/10 active:scale-95">
                                 <LogOut className="w-5 h-5 mr-3" /> 
                                 <span className="relative z-10 font-semibold">Sign Out & Exit</span>
                               </button>
                            ) : (
                              <>
                                 <button onClick={() => { signIn(); setShowMenu(false); }} className="relative w-full flex items-center px-5 py-3.5 text-[15px] font-medium text-gray-900 dark:text-white bg-white/60 dark:bg-[#2C2C2E]/60 backdrop-blur-xl hover:bg-white/80 dark:hover:bg-[#2C2C2E]/80 overflow-hidden group transition-all duration-300 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.6)] border border-white/60 dark:border-white/10 active:scale-95">
                                    <LogIn className="w-5 h-5 mr-3" /> 
                                    <span className="relative z-10 font-semibold">Sign In (Google)</span>
                                 </button>
                                 <button onClick={() => { localStorage.removeItem('guestMode'); window.location.reload(); }} className="relative w-full flex items-center px-5 py-3.5 text-[15px] font-medium text-red-500 bg-white/60 dark:bg-[#2C2C2E]/60 backdrop-blur-xl hover:bg-white/80 dark:hover:bg-[#2C2C2E]/80 overflow-hidden group transition-all duration-300 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.6)] border border-white/60 dark:border-white/10 active:scale-95">
                                    <LogOut className="w-5 h-5 mr-3" /> 
                                    <span className="relative z-10 font-semibold">Exit to Start Screen</span>
                                 </button>
                              </>
                            )}
                            </div>
                         </div>
                      </div>
                   </motion.div>
                </div>, 
                document.body
             )}`;

content = content.replace(menuDropdownStr, newMenuDrawerStr);

fs.writeFileSync('src/App.tsx', content);
console.log('done refactoring UI element as requested.');
