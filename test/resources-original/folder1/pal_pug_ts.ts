/* This is a generated file */
import { PLATFORM } from 'aurelia-pal';

import folder2 from './folder2/index';

const configure = function(config) {
  config.globalResources(PLATFORM.moduleName('./test5'));
  config.globalResources(PLATFORM.moduleName('./test6'));
  folder2(config);
};

export default configure;
