let IndexGenerator = require('../src/index-generator');
let util = require('util');
let ncp = util.promisify(require('ncp').ncp);
let rimraf = util.promisify(require('rimraf'));
let fs = require('fs');

function filesEqual(file0, file1) {
  let buf0 = fs.readFileSync(file0);
  let buf1 = fs.readFileSync(file1);
  return buf0.equals(buf1);
}

function indexesEqual(root0, root1) {}

describe('generate pal', () => {
  jest.setTimeout(60 * 60 * 60 * 1000);

  const original = './test/resources-original';
  const resources = './test/resources';

  beforeEach(() => {
    return rimraf(resources).then(resp => {
      return ncp(original, resources);
    });
  });

  describe('pal js', () => {
    it('html', () => {
      const config = {
        view: 'html',
        pal: true
      };
      let compare = 'pal_html';
      let generator = new IndexGenerator(config, resources);
      return generator.run().then(resp => {
        expect(filesEqual(`${resources}/index.js`, `${resources}/${compare}.js`)).toBe(
          true
        );
        expect(
          filesEqual(
            `${resources}/folder1/index.js`,
            `${resources}/folder1/${compare}.js`
          )
        ).toBe(true);
        expect(
          filesEqual(
            `${resources}/folder1/folder2/index.js`,
            `${resources}/folder1/folder2/${compare}.js`
          )
        ).toBe(true);
      });
    });

    it('pug', () => {
      const config = {
        view: 'pug',
        pal: true
      };
      let compare = 'pal_pug';
      let generator = new IndexGenerator(config, resources);
      return generator.run().then(resp => {
        expect(filesEqual(`${resources}/index.js`, `${resources}/${compare}.js`)).toBe(
          true
        );
        expect(
          filesEqual(
            `${resources}/folder1/index.js`,
            `${resources}/folder1/${compare}.js`
          )
        ).toBe(true);
        expect(
          filesEqual(
            `${resources}/folder1/folder2/index.js`,
            `${resources}/folder1/folder2/${compare}.js`
          )
        ).toBe(true);
      });
    });
  });

  describe('pal ts', () => {
    const config = {
      view: 'pug',
      pal: true,
      fileExtension: '.ts'
    };
    it('pug', () => {
      let compare = 'pal_pug_ts';
      let generator = new IndexGenerator(config, resources);
      return generator.run().then(resp => {
        expect(filesEqual(`${resources}/index.ts`, `${resources}/${compare}.ts`)).toBe(
          true
        );
        expect(
          filesEqual(
            `${resources}/folder1/index.ts`,
            `${resources}/folder1/${compare}.ts`
          )
        ).toBe(true);
        expect(
          filesEqual(
            `${resources}/folder1/folder2/index.ts`,
            `${resources}/folder1/folder2/${compare}.ts`
          )
        ).toBe(true);
      });
    });
  });
});
