'use strict';

module.exports = function(Categories) {
  var async = require('async');
  Categories.remoteMethod('categorySelectList', {
    http: {path: '/categorySelectList', verb: 'get'},
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Get list of category for dropdown list',
  });

  Categories.categorySelectList = function(cb) {
    var filter = {
      'where': {
        'status': {
          'neq': false,
        },
      },
      'order': 'name asc',
    };
    Categories.find(filter, function(err, categories) {
      if (err) {
        cb(err);
      }
      if (categories) {
        var tempCategories = [];
        tempCategories[0] = {
          _id: '',
          name: 'Select Category',
        };
        var index = 0;
        categories.forEach(function(category, key) {
          tempCategories[key+1] = {
            _id: category.id,
            name: category.name,
          };
          index++;
        });
        cb(null, tempCategories);
      } else {
        cb(err);
      }
    });
  };
};
