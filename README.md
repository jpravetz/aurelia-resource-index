# au-generate-resource-index

Generator creates index.js to declare all resources within a folder as global

In a project generated with aurelia-cli
it is common to place all resources within a src/resources folder and to make these resources global.

This module will generate a src/resources/index.js file that includes all resources with this folder,
recursively descending into subfolders.

Generates index that is compatible with requirejs and webpack.

## Install

```bash
npm install au-generate-resource-index
```

## Configure

In aurelia.json, add the following entry for use with requirejs

```json
  "resourceListGenerator": {
    "view": "html",
    "pal": false,
    "mode": "single"
  },
```

Add the following entry for use with webpack

```json
  "resourceListGenerator": {
    "view": "html",
    "pal": true
  },
```

If using [pug](http://pugjs.org) as an html file format, set `"view": "pug"`.

## Options

- `view` - The file extension used for view source files. If using pug then set to `pug`, otherwise must be set to `html`.
- `pal` (boolean) - If true then each module is declared within a PLATFORM.moduleName() call. Used with webpack.
- `mode` - If value is `single` then will declare all global resources using a single call to globalResources. Otherwise each
resource is added individually. Do not set to `single` if using with webpack.

## Run as Gulp Task

Add a gulp task to your aurelia_project/tasks folder

```
import gulp from 'gulp';
import project from '../aurelia.json';

function generateIndex(done) {
  let path = Path.resolve(project.paths.root, project.paths.resources);
  let config = project.resourceListGenerator;
  generateFolderIndex(path, config, 0)
    .then(() => {
      done();
    })
    .catch((err) => {
      done(err);
    });
}

export default function processResources () {
  return gulp.series(generateIndex);
}
```
