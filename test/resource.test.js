let generateFolderIndex = require('../src');
let util = require('util');
let ncp = util.promisify(require('ncp').ncp);
let rimraf = util.promisify(require('rimraf'));
let fs = require('fs');


function filesEqual (file0, file1) {
  let buf0 = fs.readFileSync(file0);
  let buf1 = fs.readFileSync(file1);
  return buf0.equals(buf1)
}

function indexesEqual (root0, root1) {

}

describe('generate pal', () => {

  const original = './test/resources-original';
  const resources = './test/resources';
  const config = {
    view: 'html',
    pal: true
  };

  beforeEach(() => {
    return rimraf(resources)
      .then((resp) => {
        return ncp(original, resources);
      })
  });

  it('pal_html', () => {
    let compare = 'pal_html';
    return generateFolderIndex(resources, config)
      .then((resp) => {
        expect(filesEqual(`${resources}/index.js`, `${resources}/${compare}.js`)).toBe(true);
        expect(filesEqual(`${resources}/folder1/index.js`, `${resources}/folder1/${compare}.js`)).toBe(true);
        expect(filesEqual(`${resources}/folder1/folder2/index.js`, `${resources}/folder1/folder2/${compare}.js`)).toBe(true);
      })
  });

  it('pal_pug', () => {
    let compare = 'pal_pug';
    return generateFolderIndex(resources, config)
      .then((resp) => {
        expect(filesEqual(`${resources}/index.js`, `${resources}/${compare}.js`)).toBe(true);
        expect(filesEqual(`${resources}/folder1/index.js`, `${resources}/folder1/${compare}.js`)).toBe(true);
        expect(filesEqual(`${resources}/folder1/folder2/index.js`, `${resources}/folder1/folder2/${compare}.js`)).toBe(true);
      })
  });

});
