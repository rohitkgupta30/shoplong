'use strict';

module.exports = function(Tryproducts) {
  Tryproducts.remoteMethod('getTryItProducts', {
    http: {path: '/getTryItProducts', verb: 'get'},
    accepts: [
      {arg: 'user_id', type: 'string', http: {source: 'query'}, required: true, description: 'User Id is required.'},
      {arg: 'loggedin_user_id', type: 'string', http: {source: 'query'}, description: 'Logged in User Id is required.'},
    ],
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Get user try it products',
  });

  Tryproducts.getUserProfileDetail = function(userId, loggedInUserId = null, offset = 0, limit = 10,  cb) {
    Tryproducts.find({"where":{"user_id":userId},
    "include":
    [
      {"relation":"userDetail","scope": {"include":[{"relation":"reviews","scope":{"fields":["id"]}}],"fields":["first_name","last_name","image_url","facebook_id","total_media"]}},
      {"relation":"productDetail","scope": {"fields":["primary_image_url","name","calories"]}},
    ],'order' : 'comment_count DESC', 'offset' : offset, 'limit' : limit
    }, function(err, user) {
      if (err) {
        cb(null, err);
      } else {
        if(loggedInUserId == userId)
        {
          user.self = true;
        }
        cb(null, user);
      }
    });
  };

  Tryproducts.remoteMethod('getMyTryProducts', {
    http: {path: '/getMyTryProducts', verb: 'get'},
    accepts: [
      {arg: 'user_id', type: 'string', http: {source: 'query'}, required: true, description: 'User Id is required.'},
      {arg: 'offset', type: 'string', http: {source: 'query'}, description: 'offset for pagination.'},
      {arg: 'limit', type: 'string', http: {source: 'query'}, description: 'limit of pagiantion.'},
    ],
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Get all getMyTryProducts product',
  });

  Tryproducts.remoteMethod('getMyTryProductsCount', {
    http: {path: '/getMyTryProductsCount', verb: 'get'},
    accepts: [
      {arg: 'user_id', type: 'string', http: {source: 'query'}, required: true, description: 'User Id is required.'},
    ],
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Get all getMyTryProductsCount product',
  });

  Tryproducts.remoteMethod('deleteTryIt', {
    http: {path: '/deleteTryIt', verb: 'get'},
    accepts: [
      {arg: 'user_id', type: 'string', http: {source: 'query'}, required: true, description: 'user_id is required.'},
      {arg: 'propduct_id', type: 'string', http: {source: 'query'}, required: true, description: 'propduct_id is required.'},
    ],
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Get all deleteTryIt product',
  });

  Tryproducts.getMyTryProducts = function(userId, offset, limit, callback) {
    offset = (offset) ? offset : 0;
    limit = (limit) ? limit : 10;
    Tryproducts.find({"where":{"user_id":userId},"include":[{"relation":"productDetail", "scope":{"include":[{"relation":"storeDetail"}]}}], "offset":offset, "limit":limit, "order" : "id desc"}, function(err, productList){
      if(err) {
        callback(null, err);
      } else {
        callback(null, productList);
      }
    });
  };

  Tryproducts.getMyTryProductsCount = function(userId,callback) {
    Tryproducts.count({"user_id":userId}, function(err, productList){
      if(err) {
        callback(null, err);
      } else {
        callback(null, productList);
      }
    });
  };

  Tryproducts.deleteTryIt = function(userId, productId, callback) {
    var newObj = {"user_id": userId, "product_id": productId};
    Tryproducts.destroyAll(newObj, function(err, data) {
      if (err) {
        callback(null, err);
      } else {
        callback(null, true);
      }
    });
  };
};
