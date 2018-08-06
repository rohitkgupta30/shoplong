'use strict';

module.exports = function(Recentsearches) {
  Recentsearches.remoteMethod('getMyRecentlySearches', {
    http: {path: '/getMyRecentlyViewedproducts', verb: 'get'},
    accepts: [
      {arg: 'user_id', type: 'string', http: {source: 'query'}, required: true, description: 'User Id is required.'},
      {arg: 'offset', type: 'string', http: {source: 'query'}, description: 'offset for pagination.'},
      {arg: 'limit', type: 'string', http: {source: 'query'}, description: 'limit of pagiantion.'},
    ],
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Get all getMyRecentlySearches list',
  });

  Recentsearches.beforeRemote('create', function(context, data, next) {
    if (context.req.body && context.req.body.user_id &&  context.req.body.item_id) {
      Recentsearches.findOne({'where': {'user_id': context.req.body.user_id, 'item_id': context.req.body.item_id}}, function(err, data) {
        if (data) {
          var obj = {created: Date.now()};
          Recentsearches.updateAll({'id': data.id}, obj, function(err, userData) {
            if (userData) {
              var err = new Error('already add but date updated');
                err.status = 200;
                err.statusCode = 200;
                err.code = 'EXIST';
                next(err);
            } else {
              next(err);
            }
          });
        } else {
          next();
        }
      });
    }
  });

  Recentsearches.getMyRecentlySearches = function(userId, offset = 0, limit = 20, callback) {
    Recentsearches.find({'where': {'user_id': userId}, 'include': [
      {'relation': 'productDetail', 'scope': {'fields': ['primary_image_url', 'name', 'brand_name', 'id']}},
      {'relation': 'itemUserDetail', 'scope': {'fields': ['facebook_id', 'name', 'id']}},
      {'relation': 'brandDetail', 'scope': {'fields': ['image_url', 'name', 'product_count', 'slug', 'id']}},
      {'relation': 'categoryDetail', 'scope': {'fields': ['image_url', 'name', 'product_count', 'id']}}],
      'offset': offset, 'limit': limit, 'order': 'id desc'}, function(err, dataList) {
      if (err) {
        callback(null, err);
      } else {
        callback(null, dataList);
      }
    });
  };
};
