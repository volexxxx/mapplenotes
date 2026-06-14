const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'relative w-full max-w-lg max-h-[90dvh] w-full max-w-lg rounded-[2rem] bg-[#F2F1F6]/90 dark:bg-[#1C1C1E]/90 backdrop-blur-[64px] saturate-[1.5] border border-white/40 dark:border-white/10 shadow-2xl flex flex-col pt-10 pb-8 px-8 overflow-y-auto',
  'relative w-full max-w-lg max-h-[90dvh] rounded-[2rem] bg-[#F2F1F6]/90 dark:bg-[#1C1C1E]/90 backdrop-blur-3xl saturate-[1.5] border border-white/40 dark:border-white/5 shadow-2xl flex flex-col pt-10 pb-8 px-8 overflow-y-auto'
);

fs.writeFileSync('src/App.tsx', code);
