const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const sharp = require('sharp');
const chokidar = require('chokidar');

const srcDir = './source/';
const destDir = './dest/';
const template1SP = './resource/1sp-narrow.png';
const template2SP = './resource/2sp-narrow.png';

const extensions = ['.jpg', '.png'];

const width1SP = 827;
const density = 600;

const replaceFilePath = (beforeDir, afterDir, filePath) => path.join(afterDir, path.relative(beforeDir, filePath));

// 枠をのせる
function placeFlame(srcPath, destPath) {
  const extname = path.extname(srcPath).toLowerCase();

  if (extensions.includes(extname)) {
    sharp(srcPath).metadata().then((metadata) => {
      const templateFile = (metadata.width === width1SP) ? template1SP : template2SP;
      sharp(srcPath)
        .composite([{
          input: templateFile,
          top: 0,
          left: 0,
        }])
        //   .toFormat(formatOptions[0])
        .withMetadata({ density })
        .toFile(destPath, (err) => {
          if (err) {
            console.error('An error occurred while processing image:', err);
          } else {
            console.log('Converted image:', srcPath);
            // 元データは消しておく
            fsExtra.removeSync(srcPath);
          }
        });
    });
  } else {
    // PSDとか
    fs.copyFile(srcPath, destPath, (err) => {
      if (err) {
        console.error('An error occurred while copying image:', err);
      } else {
        console.log('Copied image:', srcPath);
      }
    });
  }
}

const main = async () => {
  fsExtra.ensureDir(srcDir);
  // watch image files
  const srcWatcher = chokidar.watch(srcDir, {
    ignored: /(^|[\/\\])\../, // 隠しファイルを無視
    persistent: true,
  });

  srcWatcher.on('all', (event, filePath) => {
      const targetFilePath = replaceFilePath(srcDir, destDir, filePath);
      if( event === 'add' || event === 'change' ){
        placeFlame(filePath, targetFilePath);
      } else if( event === 'addDir' ){
        fsExtra.ensureDirSync(targetFilePath);
      } else if( event === 'unlink' ){
        // Do nothing.
      }
    })
}

main();
