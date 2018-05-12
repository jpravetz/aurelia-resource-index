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

/**
 * Reads the list of files to exclude, found in folder/.resourceignore file.
 * This file should contain a white-space delimited list of file names, minus their extensions.
 * @param root
 * @returns {Promise<any>}
 */
function readExclusions (root) {
  return new Promise((resolve, reject) => {
    let ignorePath = Path.resolve(root, '.resourceignore');
    fsStat(ignorePath)
      .then((stat) => {
        if (stat.isFile()) {
          return fsReadFile(ignorePath)
            .then((resp) => {
              if (resp) {
                let exclusions = String(resp).trim().split(REGEX.sep);
                resolve(exclusions);
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

function wrapModuleName (moduleId, config) {
  if (config.pal) {
    return `PLATFORM.moduleName('./${moduleId}')`;
  } else if (config.mode === 'single') {
    return `'${moduleId}'`;
  }
  return `'./${moduleId}'`;
}

const fsStat = util.promisify(fs.stat);
const fsReaddir = util.promisify(fs.readdir);
const fsReadFile = util.promisify(fs.readFile);
const fsWriteFile = util.promisify(fs.writeFile);


/**
 * Recursively walks a resource folder tree adding finding and adding all components as global
 * resources by generating an index.js file. A list of excluded components that should not be added
 * may be listed in .resourceignore files at the same level as each index.
 * @param root {String} Root folder
 * @param config {Object} Config options
 * @param [config.view] {String} File extension to use for html file (eg. 'html', 'pug')
 * @param [config.pal=false] {Boolean} If true then wrap moduleIds in PLATFORM.moduleName()
 * @param [config.mode] {String} If 'single' then all resources are added as an array by calling
 *   globalResources() once.  Otherwise each resource is added individually by calling
 *   globalResources().
 * @param level {number} Set to 0 for root folder
 * @returns {Promise<any[]>}
 */
module.exports = function generateFolderIndex (root, config, level) {
  if (typeof level !== 'number') {
    level = 0;
  }
  if (!config) {
    throw new Error('Missing config');
  }
  let exclusions = [];
  let imports = [];
  let resources = {};
  return Promise.resolve()
    .then(() => {
      return readExclusions(root);
    })
    .then((resp) => {
      exclusions = resp;
      return fsReaddir(root);
    })
    .then((files) => {
      let jobs = [];
      files.forEach(file => {
        let path = Path.resolve(root, file);
        let job = fsStat(path)
          .then((stat) => {
            if (stat.isDirectory()) {
              imports.push(file);
              return generateFolderIndex(path, config, level + 1);
            } else if (stat.isFile() && !REGEX.index.test(file)) {
              let base = fileBase(file);
              if (!exclusions.includes(base)) {
                ['js', 'html'].forEach(type => {
                  if (REGEX[type].test(file)) {
                    resources[base] = resources[base] ? resources[base] : {};
                    resources[base][type] = true;
                  }
                });
              }
            }
          });
        jobs.push(job);
      });
      return Promise.all(jobs);
    })
    .then((resp) => {
      let len = Object.keys(resources).length;

      if (MODE.skipEmptyFolder && !imports.length && !len) {
        console.log('Skipping folder ', root);
        return Promise.resolve();
      }

      let buf = Buffer.alloc(4096);
      let offset = 0;
      if (len && config.pal) {
        offset += buf.write('import {PLATFORM} from \'aurelia-pal\';\n\n', offset);
      }
      if (imports.length) {
        imports.forEach(name => {
          offset += buf.write(`import ${toCamelCase(name)} from './${name}/index';\n`, offset);
        });
        offset += buf.write('\n', offset);
      }
      if (config.mode === 'single') {
        if (len) {
          offset += buf.write('let resources = [\n', offset);
          let idx = 0;
          Object.keys(resources).forEach(key => {
            let comma = (++idx < len) ? ',' : '';
            let resource = resources[key].js ? key : `${key}.${config.view}`;
            offset += buf.write(`  ${wrapModuleName(resource, config)}${comma}\n`, offset);
          });
          offset += buf.write('];\n', offset);
        } else {
          offset += buf.write('let resources = [];\n', offset);
        }
        let pre = level ? '' : './';
        imports.forEach(name => {
          offset += buf.write(`${toCamelCase(name)}.forEach((module) => {\n`, offset);
          offset += buf.write(`  resources.push('${pre}${name}/' + module);\n`, offset);
          offset += buf.write('});\n', offset);
        });
        if (level) {
          offset += buf.write('\nexport default resources;\n', offset);
        } else {
          offset += buf.write('\nexport function configure (config) {\n', offset);
          offset += buf.write('  config.globalResources(resources);\n', offset);
          offset += buf.write('}\n', offset);
        }
      } else {
        offset += buf.write('const configure = function (config) {\n', offset);
        if (len) {
          Object.keys(resources).forEach(key => {
            let resource = resources[key].js ? key : `${key}.${config.view}`;
            offset += buf.write(`  config.globalResources(${wrapModuleName(resource, config)});\n`, offset);
          });
        }
        imports.forEach(name => {
          offset += buf.write(`  ${toCamelCase(name)}(config);\n`, offset);
        });
        offset += buf.write('};\n', offset);
        offset += buf.write('\nexport default configure;\n', offset);
      }
      let indexFile = Path.resolve(root, 'index.js');
      console.log('Generating ', indexFile);
      return fsWriteFile(indexFile, buf.slice(0, offset));
    });
}

