const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  '<MoreHorizontal className="w-6 h-6 text-gray-900 dark:text-white" strokeWidth={2.5} />',
  '<span className="text-sm font-semibold text-gray-900 dark:text-white">Menu</span>'
);

content = content.replace(
  '<button onClick={() => setShowMenu(!showMenu)} className="flex items-center justify-center w-10 h-10 rounded-full',
  '<button onClick={() => setShowMenu(!showMenu)} className="flex items-center justify-center h-10 px-4 rounded-full'
);

content = content.replace(
  'backdrop-blur-3xl border border-white/60 dark:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.6)] rounded-3xl p-3 z-50 flex flex-col gap-2',
  'backdrop-blur-[40px] saturate-[1.5] border border-white/50 dark:border-white/10 shadow-[0_16px_64px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.5)] rounded-3xl p-3 z-50 flex flex-col gap-2'
);
content = content.replace(
  'absolute top-14 right-0 w-64 bg-white/30 dark:bg-white/5',
  'absolute top-14 right-0 w-64 bg-white/40 dark:bg-black/70'
);

content = content.replace(
  '>ZOOM<',
  '>FONT SIZE<'
);

const p1 = content.indexOf('<div className="flex items-center justify-between mb-3">');
if (p1 !== -1 && content.substring(p1, p1 + 300).includes('GLASS EFFECT')) {
   const endDiv = content.indexOf('</div>', content.indexOf('</button>', p1)) + 6;
   content = content.substring(0, p1) + content.substring(endDiv);
}

content = content.replace(
  'document.documentElement.style.fontSize = `${zoomLevel}%`;',
  '// zoom removed'
);

fs.writeFileSync('src/App.tsx', content);
console.log('done replacing app.tsx script');
