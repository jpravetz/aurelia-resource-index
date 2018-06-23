let fs = require('fs')
let Path = require('path');
let util = require('util');

/**
 * Task generates webpack compatible index.js files under the src/resources folder,
 * recursively descending and including every file that is found.
 * To exclude files in a particular folder, add their names to a .resourceignore file in that
 * folder.
 */

const MODE = {
  skipEmptyFolder: false   // only works if false
};

const REGEX = {
  index: /^index.(js|mjs|ts)$/i,
  js: /\.(js|mjs|ts)$/i,
  html: /\.(ejs|pug|jade|html)$/i,
  base: /([^\/\.]+)\.[a-zA-Z0-9]+$/,
  sep: /[,\s]+/
};

function fileBase (path) {
  let m = path.match(REGEX.base);
  if (m && m[1]) {
    return m[1];
  }
}

function toCamelCase (str) {
  return str.split('-').map(function (word, index) {
    if (index === 0) {
      return word.toLowerCase();
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join('');
}


const fsStat = util.promisify(fs.stat);
const fsReaddir = util.promisify(fs.readdir);
const fsReadFile = util.promisify(fs.readFile);
const fsWriteFile = util.promisify(fs.writeFile);

class IndexGenerator {
  constructor (config, root, level=0) {
    this.config = config;
    this.root = root;
    this.level = (typeof level === 'number' ? level : 0);
    this.imports = [];
    this.resources = {};
    this.exclusions = [];
  }

  run () {
    if (!this.config) {
      throw new Error('Missing config');
    }
    if (!this.root) {
      throw new Error('Missing root');
    }
    console.log(`Processing folder ${this.root}`);
    let data;
    return Promise.resolve()
      .then(() => {
        return this.readExclusions();
      })
      .then(() => {
        return this.getResourceList();
      })
      .then((resp) => {
        return this.generateIndexBuffer();
      })
      .then((resp) => {
        data = resp;
        return this.compareIndexFile(resp)
      })
      .then((bEquals) => {
        if (!bEquals) {
          return this.writeIndexFile(data);
        }
        console.log('No changes for index.js');
      })
      .then((resp) => {
        return this.processSubFolders();
      })
  }

  getResourceList () {
    this.resources = {};
    this.imports = [];
    return fsReaddir(this.root)
      .then((files) => {
        let jobs = [];
        files.forEach(file => {
          let job = fsStat(Path.resolve(this.root, file))
            .then((stat) => {
              if (stat.isDirectory()) {
                this.imports.push(file);
              } else if (stat.isFile() && !REGEX.index.test(file)) {
                let base = fileBase(file);
                if (!this.exclusions.includes(base)) {
                  ['js', 'html'].forEach(type => {
                    if (REGEX[type].test(file)) {
                      this.resources[base] = this.resources[base] ? this.resources[base] : {};
                      this.resources[base][type] = true;
                    }
                  });
                }
              }
            });
          jobs.push(job);
        });
        return Promise.all(jobs);
      });
  }

  processSubFolders () {
    let jobs = [];
    console.log(`Processing ${this.imports.length} subfolders`);
    this.imports.forEach(file => {
      let generator = new IndexGenerator(this.config, Path.resolve(this.root, file), this.level + 1);
      let job = generator.run();
      jobs.push(job);
    });
    return Promise.all(jobs);
  }

  generateIndexBuffer () {
    let resourceKeys = Object.keys(this.resources);
    let resourceLen = resourceKeys.length;

    if (MODE.skipEmptyFolder && !this.imports.length && !resourceLen) {
      console.log('Skipping folder ', this.root);
      return Promise.resolve();
    }

    let buf = Buffer.alloc(4096);
    let offset = 0;
    offset += buf.write('/* This is a generated file */\n');
    if (resourceLen && this.config.pal) {
      offset += buf.write('import {PLATFORM} from \'aurelia-pal\';\n\n', offset);
    }
    if (this.imports.length) {
      this.imports.forEach(name => {
        offset += buf.write(`import ${toCamelCase(name)} from './${name}/index';\n`, offset);
      });
      offset += buf.write('\n', offset);
    }
    if (this.config.mode === 'single') {
      if (resourceLen) {
        offset += buf.write('let resources = [\n', offset);
        let idx = 0;
        resourceKeys.forEach(key => {
          let comma = (++idx < resourceLen) ? ',' : '';
          let resource = this.resources[key].js ? key : `${key}.${this.config.view}`;
          offset += buf.write(`  ${this.wrapModuleName(resource)}${comma}\n`, offset);
        });
        offset += buf.write('];\n', offset);
      } else {
        offset += buf.write('let resources = [];\n', offset);
      }
      let pre = this.level ? '' : './';
      this.imports.forEach(name => {
        offset += buf.write(`${toCamelCase(name)}.forEach((module) => {\n`, offset);
        offset += buf.write(`  resources.push('${pre}${name}/' + module);\n`, offset);
        offset += buf.write('});\n', offset);
      });
      if (this.level) {
        offset += buf.write('\nexport default resources;\n', offset);
      } else {
        offset += buf.write('\nexport function configure (config) {\n', offset);
        offset += buf.write('  config.globalResources(resources);\n', offset);
        offset += buf.write('}\n', offset);
      }
    } else {
      offset += buf.write('const configure = function (config) {\n', offset);
      if (resourceLen) {
        resourceKeys.forEach(key => {
          let resource = this.resources[key].js ? key : `${key}.${this.config.view}`;
          offset += buf.write(`  config.globalResources(${this.wrapModuleName(resource)});\n`, offset);
        });
      }
      this.imports.forEach(name => {
        offset += buf.write(`  ${toCamelCase(name)}(config);\n`, offset);
      });
      offset += buf.write('};\n', offset);
      offset += buf.write('\nexport default configure;\n', offset);
    }
    return Promise.resolve({ buf: buf, len: offset });
  }

  writeIndexFile (data) {
    let indexFile = Path.resolve(this.root, 'index.js');
    console.log('Generating ', indexFile);
    return fsWriteFile(indexFile, data.buf.slice(0, data.len));
  }

  compareIndexFile (data) {
    return fsReadFile(this.root)
      .then((existingBuf) => {
        return Promise.resolve(data.buf.equals(existingBuf));
      })
      .catch((err) => {
        return Promise.resolve(false);
      });
  }

  wrapModuleName (moduleId) {
    if (this.config.pal) {
      return `PLATFORM.moduleName('./${moduleId}')`;
    } else if (this.config.mode === 'single') {
      return `'${moduleId}'`;
    }
    return `'./${moduleId}'`;
  }


  /**
   * Reads the list of files to exclude, found in folder/.resourceignore file.
   * This file should contain a white-space delimited list of file names, minus their extensions.
   * @param root
   * @returns {Promise<any>}
   */
  readExclusions () {
    this.exclusions = [];
    return new Promise((resolve, reject) => {
      let ignorePath = Path.resolve(this.root, '.resourceignore');
      fsStat(ignorePath)
        .then((stat) => {
          if (stat.isFile()) {
            return fsReadFile(ignorePath)
              .then((resp) => {
                if (resp) {
                  this.exclusions = String(resp).trim().split(REGEX.sep);
                  resolve(this.exclusions);
                }
                resolve([]);
              })
              .catch((err) => {
                resolve([]);
              });
          } else {
            resolve([]);
          }
        })
        .catch((err) => {
          resolve([]);
        });
    });
  }

}

module.exports = IndexGenerator;