let generateFolderIndex = require('../src/index');
let util = require('util');
let ncp = util.promisify(require('ncp').ncp);
let rimraf = util.promisify(require('rimraf'));




describe('generate pal', () =>{

  const original = './resources-original';
  const resources = './resources';
  const config = {
    view: 'html',
    pal: true
  };

  beforeEach(()=>{
    return rimraf(resources)
      .then((resp) => {
        return ncp(original,resources);
      })
  });

  test('1',()=>{
    return generateFolderIndex(resources,config);
  });

});
