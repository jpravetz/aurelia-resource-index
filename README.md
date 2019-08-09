# aurelia-resource-index

Generates global resource index files for all components within a folder.

In a project generated with [aurelia-cli](https://github.com/aurelia/cli), it is
common to place all global components within a `src/resources` folder.

This module will generate index files (e.g. `src/resources/index.js`) that
includes all resources with this folder, recursively descending into subfolders,
creating individual index files in each folder. By default, ignores files and
folders that being with `'.'` (period).

Can be configured to generate index files that are compatible with `requirejs`,
`systemjs` or `webpack`.

## Install

```bash
npm install aurelia-resource-index
```

## Configure

If you create a `gulp` task for this module, it is recommended you configure the
module using `aurelia.json` as shown here.

Add the following entry for use with `requirejs` or `systemjs`.

```json
  "resourceIndexer": {
    "view": "html",
    "pal": false,
    "mode": "single",
    "fileExtension": ".ts",
    "verbose": 1,
    "source": ["src/resources/**/*.*"]
  },
```

The last `source` entry is used by the `watch` task.

Add the following entry for use with `webpack`.

```json
  "resourceIndexer": {
    "view": "html",
    "pal": true
  },
```

## aurelia.json resourceIndex config

- `view` - The file extension used when looking for view source files that do
  not have an accompanying js/ts file. Defaults to `html`. As an example, if
  using [pug](http://pugjs.org) as an html preprocessor format then set to
  `pug`.
- `pal` (boolean) - If true then each module is declared within a
  `PLATFORM.moduleName()` call. Used with `webpack`.
- `mode` - If value is `single` then will declare all global resources using a
  single call to `globalResources`. Otherwise each resource is added individually.
  Do not set to `single` if using with `webpack`.
- `fileExtension` - The file extension to use for the generated files. Defaults
  to `.js`.
- `verbose` (integer) - If 1 then logs to console every index file that is
  updated or created. If 2 logs files that are unchanged. Default 0 for no
  logging.
- `exclude` (RegExp) - Exclude files and folders with names that match this
  pattern. Defaults to files and folders that begin with a period `/^\./`.
- `excludeFile` (string) - The name of a file with a list of files to exclude at
  that folder level. Defaults to `.resourceignore`.

To exclude certain files and folders from being indexed, set an exclude RegExp,
or list specific files to exclude in a `.resourceignore` file in the same folder
as the file you wish to excluse. Do not include the file extension when using
`.resourceignore`. **Hint**: you can put files that you are not using in a
`.unused` or `.deprecated` folder.

## Run as Gulp Task on resources folder

Add a `gulp` task to your `aurelia_project/tasks` folder.

Create the file `${PROJECT_ROOT}/aurelia_project/tasks/resource-indexer.ts` (or
.js) with the following code:

```ts
import * as gulp from 'gulp';
import * as project from '../aurelia.json';
import * as IndexGenerator from 'aurelia-resource-index';

function generateResourceIndexFiles(done) {
  let config = project.resourceIndexer;
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

## Build (webpack only)

In `aurelia_projects/tasks/build.ts`

```js
import resourceIndexer from './resource-indexer';
```

And add this to the task list:

```js
export { config, resourceIndexer, buildWebpack, build as default };
```

## Build (requirejs and systemjs only)

In `aurelia_projects/tasks/build.ts`

```ts
import resourceIndexer from './resource-indexer';
```

And add the resourceIndexer as a gulp task:

```ts
let build = gulp.series(
  readProjectConfiguration,
  resourceIndexer,
  gulp.parallel(transpile, processMarkup, processJson, processCSS, copyFiles),
  writeBundles
);
```

## Watch (webpack only)

Please contribute.

## Watch (requirejs and systemjs only)

In `aurelia_projects/tasks/watch.ts`

```ts
import resourceIndexer from './resource-indexer';
```

and add this entry to the watches array:

```ts
  { name: 'globalResource', callback: resourceIndexer, source: project.resourceIndexer.source }
```

## main.ts

In your `main.js` or `main.ts` file add the following. For Webpack, wrap
`resources` with `PLATFORM.moduleName('resources')`.

```js
// Load the generated index.js
aurelia.use.feature('resources');
```

## Developer

Build

```bash

```

Test

```bash
npm test
```
