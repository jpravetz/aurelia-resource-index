/* This is a generated file */
import { PLATFORM } from 'aurelia-pal';

import folder1 from './folder1/index';

const configure = function(config) {
  config.globalResources(PLATFORM.moduleName('./test1'));
  config.globalResources(PLATFORM.moduleName('./test2'));
  config.globalResources(PLATFORM.moduleName('./test3.html'));
  folder1(config);
};

export default configure;
