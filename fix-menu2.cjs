const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /<div className="fixed inset-0 z-\[100\] flex justify-end">/g,
  '<div className="fixed inset-0 z-[100] flex justify-center items-center p-4">'
);

// We need to also change the "mt-[5dvh]" to m-auto no-margin or whatever fits center.
code = code.replace(
  'm-auto mt-[5dvh] rounded-3xl bg-white/70 dark:bg-black/70',
  'w-full max-w-lg rounded-[2rem] bg-[#F2F1F6]/90 dark:bg-[#1C1C1E]/90'
);

fs.writeFileSync('src/App.tsx', code);
