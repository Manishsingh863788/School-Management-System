const fs = require('fs');
const path = require('path');

function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach((element) => {
    const src = path.join(from, element);
    const dest = path.join(to, element);
    if (fs.lstatSync(src).isFile()) {
      fs.copyFileSync(src, dest);
    } else {
      copyFolderSync(src, dest);
    }
  });
}

copyFolderSync(path.resolve(__dirname, '../client/dist'), path.resolve(__dirname, '../dist'));
console.log('✓ Successfully mirrored client/dist to root dist');
