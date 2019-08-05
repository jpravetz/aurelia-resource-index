# aurelia-resource-index

Generates `index.js` or `index.ts` that declares all resources within a folder
and it's subfolders as global.

In a project generated with [aurelia-cli](https://github.com/aurelia/cli), it is
common to place all resources within a `src/resources` folder and to make these
resources global.

This module will generate an index file (e.g. `src/resources/index.js`) that
includes all resources with this folder, recursively descending into subfolders.
By default, ignores files and folders that being with `'.'` (period).

Can be configured to generate index that is compatible with `requirejs` or
`webpack`.

## Install

```bash
npm install aurelia-resource-index
```

## Configure

If you create a `gulp` task for this module, it is recommended you configure the
module using `aurelia.json` as shown here.

Add the following entry for use with `requirejs`

```json
  "resourceIndexer": {
    "view": "html",
    "pal": false,
    "mode": "single"
  },
```

Add the following entry for use with `webpack`

```json
  "resourceIndexer": {
    "view": "html",
    "pal": true,
    "fileExtension": ".ts"    // defaults to ".js"
  },
```

## aurelia.json resourceIndex Options

- `view` - The file extension used for view source files. Defaults to `html`. As
  an example, if using [pug](http://pugjs.org) as an html preprocessor format
  then set to `pug`.
- `pal` (boolean) - If true then each module is declared within a
  `PLATFORM.moduleName()` call. Used with `webpack`.
- `mode` - If value is `single` then will declare all global resources using a
  single call to `globalResources`. Otherwise each resource is added individually.
  Do not set to `single` if using with `webpack`.
- `fileExtension` - The file extension to use for the generated files. Defaults
  to `.js`. Set to `.ts` for typescript.
- `verbose` (integer) - If 1 then logs to console every index file that is
  updated or created. If 2 logs files that are unchanged. Default 0 for no
  logging.
- `exclude` (RegExp) - Exclude files and folders with names that match this
  pattern. Defaults to files and folders that begin with a period `/^\./`.
- `excludeFile` (string) - The name of a file with a list of files to exclude.
  Defaults to `.resourceignore`.

To exclude certain files and folders from being indexed, set an exclude RegExp,
or list specific files to exclude in a `.resourceignore` file. Do not include
the file extension when using `.resourceignore`. **Hint**: you can put files
that you are not using in a `.unused` or `.deprecated` folder.

## Run as Gulp Task

Add a `gulp` task to your `aurelia_project/tasks` folder.

Create the file `${PROJECT_ROOT}/aurelia_project/tasks/resource-indexer.ts` (or
.js) with the following code:

```ts
import * as gulp from 'gulp';
import * as project from '../aurelia.json';
import * as IndexGenerator from 'aurelia-resource-index';

function generateResourceIndexFiles(done) {
  let config = project.resourceIndex;
  let generator = new IndexGenerator(config, project.paths.root, project.paths.resources);
  generator
    .run()
    .then(resp => {
      done();
    })
    .catch(err => {
      done(err);
    });
}

const run = gulp.series(generateResourceIndexFiles);

export { run as default };
```

Add this task as a build task in build.ts. Import the task:

```js
import resourceIndexer from './resource-indexer';
```

Then add this to the task list:

```js
export { config, resourceIndexer, buildWebpack, build as default };
```

## Developer

Build

```bash

```

Test

```bash
npm test
```
