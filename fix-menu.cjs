const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldMenu = `                   <motion.div 
                      initial={{ x: '100%', opacity: 0, scale: 0.95 }} 
                      animate={{ x: 0, opacity: 1, scale: 1 }} 
                      exit={{ x: '100%', opacity: 0, scale: 0.95 }} 
                      transition={{ type: 'spring', damping: 30, stiffness: 350, mass: 0.8 }} 
                      className="relative w-80 max-w-[85vw] h-full bg-white/50 dark:bg-black/50 backdrop-blur-[48px] saturate-[1.5] border-l border-white/40 dark:border-white/10 shadow-[-10px_0_30px_rgba(0,0,0,0.1)] flex flex-col pt-16 pb-8 px-6 overflow-y-auto"
                   >`;
                   
const newMenu = `                   <motion.div 
                      initial={{ y: '10%', opacity: 0, scale: 0.95 }} 
                      animate={{ y: 0, opacity: 1, scale: 1 }} 
                      exit={{ y: '10%', opacity: 0, scale: 0.95 }} 
                      transition={{ type: 'spring', damping: 30, stiffness: 350, mass: 0.8 }} 
                      className="relative w-full max-w-lg max-h-[90dvh] m-auto mt-[5dvh] rounded-3xl bg-white/70 dark:bg-black/70 backdrop-blur-[64px] saturate-[1.5] border border-white/40 dark:border-white/10 shadow-2xl flex flex-col pt-10 pb-8 px-8 overflow-y-auto"
                   >`;

code = code.replace(oldMenu, newMenu);
fs.writeFileSync('src/App.tsx', code);
