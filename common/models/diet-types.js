'use strict';

module.exports = function(DietTypes) {
    DietTypes.remoteMethod('dietTypeSelectList', {
        http: {path: '/dietTypeSelectList', verb: 'get'},
        returns: {arg: 'result', type: 'object', root: true},
        description: 'Get list of dietType for dropdown list',
      });
    
      DietTypes.dietTypeSelectList = function(cb) {
        var filter = {
          'where': {
            'status': {
              'neq': false,
            },
          },
          'order': 'name asc',
        };
        DietTypes.find(filter, function(err, dietTypes) {
          if (err) {
            cb(err);
          }
          if (dietTypes) {
            var tempDietTypes = [];
            tempDietTypes[0] = {
              _id: '',
              name: 'Select Diet-type',
            };
            var index = 0;
            dietTypes.forEach(function(dietType, key) {
              tempDietTypes[key + 1] = {
                _id: dietType.id,
                name: dietType.name,
              };
              index++;
            });
            cb(null, tempDietTypes);
          } else {
            cb(err);
          }
        });
      };
};
