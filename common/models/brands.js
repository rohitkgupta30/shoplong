'use strict';

module.exports = function(Brands) {
  var async = require('async');
  Brands.remoteMethod('brandSelectList', {
    http: {path: '/brandSelectList', verb: 'get'},
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Get list of brand for dropdown list',
  });

  Brands.remoteMethod('generateBrandSlug', {
    http: {path: '/generateBrandSlug', verb: 'get'},
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Genereate slug of brands',
  });

  Brands.brandSelectList = function(cb) {
    var filter = {
      'where': {
        'status': {
          'neq': false,
        },
      },
      'order': 'name asc',
    };
    Brands.find(filter, function(err, brands) {
      if (err) {
        cb(err);
      }
      if (brands) {
        var tempBrands = [];
        tempBrands[0] = {
          _id: '',
          name: 'Select Brand',
        };
        var index = 0;
        brands.forEach(function(brand, key) {
          tempBrands[key + 1] = {
            _id: brand.id,
            name: brand.name,
          };
          index++;
        });
        cb(null, tempBrands);
      } else {
        cb(err);
      }
    });
  };

  Brands.generateBrandSlug = function(cb) {
    var filter = {
      'where': {
        'slug': '',
      },
      'limit': 1,
    };
    Brands.find(filter, function(err, brands) {
      if (err) {
        cb(err);
      }
      if (brands) {
        brands.forEach(function(brand, key){
          var slug = brand.name.replace(/\s+/g, '-').toLowerCase();
          var obj = {"slug": slug};
          Brands.updateAll({'id' : brand.id}, obj);
        });
        cb(null, true);
      } else {
        cb(err);
      }
    });
  };
};
