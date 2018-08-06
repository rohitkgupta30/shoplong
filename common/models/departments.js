'use strict';

module.exports = function(Departments) {
  var async = require('async');
  Departments.remoteMethod('departmentSelectList', {
    http: {path: '/departmentSelectList', verb: 'get'},
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Get list of department for dropdown list',
  });

  Departments.departmentSelectList = function(cb) {
    var filter = {
      'where': {
        'status': {
          'neq': false,
        },
      },
      'order': 'name asc',
    };
    Departments.find(filter, function(err, departments) {
      if (err) {
        cb(err);
      }
      if (departments) {
        var tempDepartments = [];
        tempDepartments[0] = {
          _id: '',
          name: 'Select Category',
        };
        var index = 0;
        departments.forEach(function(department, key) {
          tempDepartments[key + 1] = {
            _id: department.id,
            name: department.name,
          };
          index++;
        });
        cb(null, tempDepartments);
      } else {
        cb(err);
      }
    });
  };
};
