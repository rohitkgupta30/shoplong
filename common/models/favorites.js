'use strict';
var async = require('async');

module.exports = function(Favorites) {
  Favorites.remoteMethod('getMyFavorites', {
    http: {path: '/getMyFavorites', verb: 'get'},
    accepts: [
      {arg: 'user_id', type: 'string', http: {source: 'query'}, required: true, description: 'User Id is required.'},
      {arg: 'loggedin_user_id', type: 'string', http: {source: 'query'}, required: true, description: 'loggedin_user_id is required.'},
      {arg: 'offset', type: 'string', http: {source: 'query'}, description: 'offset for pagination.'},
      {arg: 'limit', type: 'string', http: {source: 'query'}, description: 'limit of pagiantion.'},
    ],
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Get all getMyFavorites product',
  });

  Favorites.remoteMethod('getMyFavoritesCount', {
    http: {path: '/getMyFavoritesCount', verb: 'get'},
    accepts: [
      {arg: 'user_id', type: 'string', http: {source: 'query'}, required: true, description: 'User Id is required.'},
    ],
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Get all getMyFavoritesCount product',
  });

  Favorites.remoteMethod('deleteFavorite', {
    http: {path: '/deleteFavorite', verb: 'get'},
    accepts: [
      {arg: 'user_id', type: 'string', http: {source: 'query'}, required: true, description: 'user_id is required.'},
      {arg: 'item_id', type: 'string', http: {source: 'query'}, required: true, description: 'item_id is required.'},
    ],
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Get all deleteFavorite product',
  });

  Favorites.getMyFavorites = function(userId, loggedInUser, offset, limit, callback) {
    async.parallel([
      function(cbk) {
        offset = (offset) ? offset : 0;
        limit = (limit) ? limit : 10;
        Favorites.find({'where':{'user_id': userId}, 'include': [
          {'relation': 'productDetail', 'scope': {'include': [{'relation': 'storeDetail'}]}},
          {'relation': 'brandDetail'},{'relation': 'categoryDetail'}], 'offset': offset, 'limit': limit, 'order': 'id desc'}, function(err, productList) {
          if (err) {
            cbk(null, err);
          } else {
            cbk(null, productList);
          }
        });
      },
      function(cbk) {
        Favorites.find({'where': {'user_id': loggedInUser}, 'fields': ['item_id']}, function(err, productList) {
          if (err) {
            cbk(null, err);
          } else {
            if (productList && productList.length) {
              var plist = [];
              productList.forEach(function(list, key) {
                plist.push(list['item_id'].toString());
                if (key == productList.length - 1) {
                  cbk(null, plist);
                }
              });
            } else {
              cbk(null, err);
            }
          }
        });
      },
    ], function(err, res) {
      //console.log(res);
      if (res && res[0].length) {
        if (res[1] && userId !== loggedInUser) {
          res[0].forEach(function(list, key) {
            if (res[1].indexOf(list['item_id'].toString()) > -1) {
              res[0][key]['favorite'] = true;
            } else {
              res[0][key]['favorite'] = false;
            }
            
            if (key == res[0].length - 1) {
              //console.log(res[0]);
              callback(null, res[0]);
            }
          });
        } else {
          callback(null, res[0]);
        }
      } else {
        callback(null, null);
      }
    });
  };

  Favorites.getMyFavoritesCount = function(userId, callback) {
    Favorites.count({'user_id': userId}, function(err, productList) {
      if (err) {
        callback(null, err);
      } else {
        callback(null, productList);
      }
    });
  };

  Favorites.deleteFavorite = function(userId, productId, callback) {
    var newObj = {
      'user_id': userId,
      'item_id': productId,
    };
    Favorites.destroyAll(newObj, function(err, data) {
      if (err) {
        callback(null, err);
      } else {
        callback(null, true);
      }
    });
  };

  Favorites.afterRemote('create', function(context, data, next) {
    var Useractivities = Favorites.app.models.user_activities;
    var productId = '';
    var brandId = '';
    var categoryId = '';
    var departmentId = '';
    var dietTypeId = '';
    if (data.type === 'product') {
      productId = data.item_id;
    } else if (data.type === 'brand') {
      brandId = data.item_id;
    } else if (data.type === 'category') {
      categoryId = data.item_id;
    } else if (data.type === 'department') {
      departmentId = data.item_id;
    } else if (data.type === 'diet_type') {
      dietTypeId = data.item_id;
    }
    var userId = data.user_id;
    var type = 'favorite';
    var activity = 'add';
    Useractivities.addActivity({'user_id': userId, 'brand_id': brandId, 'product_id': productId, 'category_id': categoryId, 'department_id': departmentId, 'diet_type_id': dietTypeId, 'type': type, 'activity': activity}, function(err, res) {
      if (err) {
        next(err);
      } else {
        next();
      }
    });
  });
};
