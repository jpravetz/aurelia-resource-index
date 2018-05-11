import gulp from 'gulp';
import {generateFolderIndex} from '../src/index';

const resources = './resources';
const config = {

}


function generateResourceIndexFiles (done) {
  let path = Path.resolve(project.paths.root, project.paths.resources);
  let config = config;
  generateFolderIndex(path, config, 0)
    .then((resp) => {
      done();
    })
    .catch((err) => {
      done(err);
    });
}

const run = gulp.series(generateResourceIndexFiles);

export {run as default};
