const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  '<button onClick={() => { logOut(); setShowMenu(false); }} className="relative w-full flex items-center px-4 py-2.5 text-sm font-medium text-red-500',
  '<button onClick={() => { logOut(); localStorage.removeItem(\'guestMode\'); window.location.reload(); setShowMenu(false); }} className="relative w-full flex items-center px-4 py-2.5 text-sm font-medium text-red-500'
);

content = content.replace(
  '<span className="relative z-10 drop-shadow-sm">Sign Out</span>',
  '<span className="relative z-10 drop-shadow-sm">Sign Out & Exit to Start</span>'
);

fs.writeFileSync('src/App.tsx', content);
console.log('done replacing sign out button');
