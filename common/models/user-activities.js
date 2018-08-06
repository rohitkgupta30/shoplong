'use strict';

module.exports = function(Useractivities) {
  Useractivities.remoteMethod('addActivity', {
    http: {path: '/addActivity', verb: 'post'},
    accepts: {arg: 'options', type: 'object', http: {source: 'body'},  description: 'Add acicity object.'},
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Add activity',
  });

  Useractivities.addActivity = function(options, callback) {
    Useractivities.create(options, function(err, data) {
      if (data) {
        callback(null, data);
      } else {
        callback(null, null);
      }
    });
  };
};
