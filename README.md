# aurelia-resource-index

Generates index.js that declares all resources within a folder as global

In a project generated with aurelia-cli
it is common to place all resources within a src/resources folder and to make these resources global.

This module will generate a src/resources/index.js file that includes all resources with this folder,
recursively descending into subfolders.

Can be configured to generate index that is compatible with requirejs and webpack.

## Install

```bash
npm install aurelia-resource-index
```

## Configure

If you create a gulp task for this module, I recommend you configure the module using aurelia.json as shown here.

Add the following entry for use with requirejs

```json
  "resourceIndex": {
    "view": "html",
    "pal": false,
    "mode": "single"
  },
```

Add the following entry for use with webpack

```json
  "resourceIndex": {
    "view": "html",
    "pal": true
  },
```

If using [pug](http://pugjs.org) as an html file format, set `"view": "pug"`.

## Configuration Options

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
  let config = project.resourceIndex;
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
