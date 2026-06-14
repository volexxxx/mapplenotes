const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `  useEffect(() => {
     localStorage.setItem('zoomLevel', String(zoomLevel));
     // zoom removed
  }, [zoomLevel]);`,
  `  useEffect(() => {
     localStorage.setItem('zoomLevel', String(zoomLevel));
     document.documentElement.style.fontSize = zoomLevel + '%';
  }, [zoomLevel]);`
);

fs.writeFileSync('src/App.tsx', code);
