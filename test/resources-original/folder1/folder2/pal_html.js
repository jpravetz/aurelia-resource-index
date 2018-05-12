import {PLATFORM} from 'aurelia-pal';

const configure = function (config) {
  config.globalResources(PLATFORM.moduleName('./test7'));
  config.globalResources(PLATFORM.moduleName('./test8.html'));
};

export default configure;
