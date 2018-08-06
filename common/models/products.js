'use strict';

module.exports = function(Products) {
  var async = require('async');
  var ObjectId = require('mongodb').ObjectID;
  var _mongoClient = require('mongodb').MongoClient;
  var _ = require('lodash');
  var merge = require('merge');

  var refineFacet = {
    'tags': [
      {$unwind: '$tags'},
      {$sortByCount: '$tags'},
      {$limit: 6},
      {$project: {name: '$_id', count: '$count'}},
    ],
    'productCount': [
      {$count: 'count'},
    ],
    'departments': [
      {$group: {'_id': '$department_name', 'count': {$sum: 1}}}, {$sort: {count: -1}},
    ],
    'categories': [
      {$group: {'_id': '$category_name', 'count': {$sum: 1}}}, {$sort: {count: -1}},
    ],
    'brands': [
      {$group: {'_id': '$brand_name', 'count': {$sum: 1}}}, {$sort: {count: -1}},
    ],
    'stores': [
      {$group: {'_id': '$store_name', 'count': {$sum: 1}}}, {$sort: {count: -1}},
    ],
    'diet_type_tags': [
      {$unwind: '$tags'},
      {$match: {'tags': /^t:/}},
      {$sortByCount: '$tags'},
      {$project: {name: '$_id', count: '$count'}},
    ],
  };

  var generalTabsOptipns = [{type: 'general', name: 'People'},
  // {type: 'general', name: 'Product'},
  {type: 'general', name: 'Category'},
  {type: 'general', name: 'Brand'}];

  Products.remoteMethod('updateProductBrandId', {
    http: {path: '/updateProductBrandId', verb: 'get'},
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Update brand id in Products',
  });

  Products.remoteMethod('updateProductCategoryId', {
    http: {path: '/updateProductCategoryId', verb: 'get'},
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Update category id in Products',
  });

  Products.remoteMethod('updateProductStoreId', {
    http: {path: '/updateProductStoreId', verb: 'get'},
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Update store id in Products',
  });

  Products.remoteMethod('updateProductDepartmentId', {
    http: {path: '/updateProductDepartmentId', verb: 'get'},
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Update department id in Products',
  });

  Products.remoteMethod('updateProductDietTypeId', {
    http: {path: '/updateProductDietTypeId', verb: 'get'},
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Update Diet Type id in Products',
  });

  Products.remoteMethod('updateViewAndRating', {
    http: {path: '/updateViewAndRating', verb: 'get'},
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Update vaies and over all rating in Products',
  });

  Products.remoteMethod('getFilters', {
    http: {path: '/getFilters', verb: 'get'},
    accepts: [
      {arg: 'action', type: 'string', http: {source: 'query'}, description: 'Page action.'},
    ],
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Get filters for more filter tab',
  });

  Products.remoteMethod('getProductMedia', {
    http: {path: '/getProductMedia', verb: 'get'},
    accepts: [
      {arg: 'product_id', type: 'string', http: {source: 'query'}, required: true, description: 'Product Id is required.'},
    ],
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Get all media of a product',
  });

  Products.remoteMethod('getProductRelatedData', {
    http: {path: '/getProductRelatedData', verb: 'get'},
    accepts: [
      {arg: 'product_id', type: 'string', http: {source: 'query'}, required: true, description: 'Product Id is required.'},
    ],
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Get related data of a product',
  });

  Products.remoteMethod('getProductSocailData', {
    http: {path: '/getProductSocailData', verb: 'get'},
    accepts: [
      {arg: 'product_id', type: 'string', http: {source: 'query'}, required: true, description: 'Product Id is required.'},
      {arg: 'user_id', type: 'string', http: {source: 'query'}, required: true, description: 'User Id is required.'},
    ],
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Get all media of a product',
  });

  Products.remoteMethod('refinementsByTags', {
    http: {path: '/refinementsByTags', verb: 'get'},
    accepts: [
      {arg: 'tags', type: 'string', http: {source: 'query'}, required: true, description: 'Tags is required.'},
      {arg: 'name', type: 'string', http: {source: 'query'}, description: 'Name is requird.'},
      {arg: 'queryTags', type: 'string', http: {source: 'query'}, description: 'Filter tags eg. category:Accessories,department:Electrics'},
      {arg: 'offset', type: 'string', http: {source: 'query'}, description: 'paging  offset.'},
      {arg: 'limit', type: 'string', http: {source: 'query'}, description: 'paging  limit.'},
    ],
    returns: {arg: 'result', type: 'string'},
    description: 'Product review  list.',
  });

  Products.remoteMethod('autocompletData', {
    http: {path: '/autocompletData', verb: 'get'},
    accepts: [
      {arg: 'keyword', type: 'string', http: {source: 'query'}, description: 'keyword is requird.'},
      {arg: 'filters', type: 'string', http: {source: 'query'}, description: 'filters.'},
      {arg: 'action', type: 'string', http: {source: 'query'}, description: 'action.'},
      {arg: 'limit', type: 'string', http: {source: 'query'}, description: 'paging  limit.'},
    ],
    returns: {arg: 'result', type: 'string'},
    description: 'Search data list.',
  });

  Products.remoteMethod('searchData', {
    http: {path: '/searchData', verb: 'get'},
    accepts: [
      {arg: 'keyword', type: 'string', http: {source: 'query'}, description: 'keyword is requird.'},
      {arg: 'filters', type: 'string', http: {source: 'query'}, description: 'filters.'},
      {arg: 'userId', type: 'string', http: {source: 'query'}, description: 'userId.'},
      {arg: 'offset', type: 'string', http: {source: 'query'}, description: 'paging  offset.'},
      {arg: 'limit', type: 'string', http: {source: 'query'}, description: 'paging  limit.'},
    ],
    returns: {arg: 'result', type: 'string'},
    description: 'Search data list.',
  });

  Products.remoteMethod('searchDataCount', {
    http: {path: '/searchDataCount', verb: 'get'},
    accepts: [
      {arg: 'keyword', type: 'string', http: {source: 'query'}, required: true, description: 'keyword is requird.'},
      {arg: 'filters', type: 'string', http: {source: 'query'}, description: 'filters.'},
      {arg: 'userId', type: 'string', http: {source: 'query'}, description: 'userId.'},
    ],
    returns: {arg: 'result', type: 'string'},
    description: 'Search data list.',
  });

  Products.remoteMethod('searchActivityFeed', {
    http: {path: '/searchActivityFeed', verb: 'get'},
    accepts: [
      {arg: 'keyword', type: 'string', http: {source: 'query'}, description: 'keyword is requird.'},
      {arg: 'filters', type: 'string', http: {source: 'query'}, description: 'filters.'},
      {arg: 'userId', type: 'string', http: {source: 'query'}, description: 'userId.'},
      {arg: 'offset', type: 'string', http: {source: 'query'}, description: 'paging  offset.'},
      {arg: 'limit', type: 'string', http: {source: 'query'}, description: 'paging  limit.'},
    ],
    returns: {arg: 'result', type: 'string'},
    description: 'Search Activity Feed list.',
  });

  Products.remoteMethod('searchActivityFeedCount', {
    http: {path: '/searchActivityFeedCount', verb: 'get'},
    accepts: [
      {arg: 'keyword', type: 'string', http: {source: 'query'}, description: 'keyword is requird.'},
      {arg: 'filters', type: 'string', http: {source: 'query'}, description: 'filters.'},
      {arg: 'userId', type: 'string', http: {source: 'query'}, description: 'userId.'},
    ],
    returns: {arg: 'result', type: 'string'},
    description: 'Search data list.',
  });

  Products.remoteMethod('homeActivityFeed', {
    http: {path: '/homeActivityFeed', verb: 'get'},
    accepts: [
      {arg: 'offset', type: 'string', http: {source: 'query'}, description: 'paging  offset.'},
      {arg: 'limit', type: 'string', http: {source: 'query'}, description: 'paging  limit.'},
    ],
    returns: {arg: 'result', type: 'string'},
    description: 'Home Activity Feed list.',
  });

  Products.getProductMedia = function(productId, callback) {
    async.parallel([
      function(cb) {
        Products.findOne({'where': {'id': productId}, 'include': [
          {'relation': 'brandDetail', 'scope': {'fields': ['image_url', 'name', 'product_count']}},
          {'relation': 'mediaLikes', 'scope': {'fields': ['user_id']}},
        ], 'fields': ['primary_image_url', 'name', 'brand_id', 'id', 'large_image_url']}, function(err, images) {
          (err) ? cb(null, err) : cb(null, images);
        });
      },
      function(cb) {
        var review_media = Products.app.models.review_media;
        review_media.find({
          'where': {'product_id': productId},
          'include': [
            {'relation': 'productDetail', 'scope': {'include': [{'relation': 'brandDetail', 'scope': {'fields': ['image_url', 'name', 'product_count']}}], 'fields': ['primary_image_url', 'name', 'brand_id']}},
            {'relation': 'userDetail', 'scope': {'fields': ['first_name', 'last_name', 'facebook_id']}},
            {'relation': 'reviewDetail', 'scope': {'fields': ['review', 'rating', 'created']}},
            {'relation': 'commentDetail', 'scope': {'fields': ['comment', 'created']}},
            {'relation': 'replyDetail', 'scope': {'fields': ['reply', 'created']}},
            {'relation': 'mediaLikes', 'scope': {'fields': ['user_id']}},
          ],
          'fields': ['media', 'type', 'user_id', 'review_id', 'comment_id', 'product_id', 'reply_id', 'id']},
        function(err, res) {
          (err) ? cb(null, err) : cb(null, res);
        });
      },
    ], function(err, res) {
      if (err) {
        callback(err, null);
      } else {
        var images = [];
        
        res[1].map(function(list, key) {
          var imgData = list.toJSON();
          if (imgData.media && imgData.review_id === "") {
            var imageData = {type: 'product', image: imgData.media, data: imgData};
            images.push(imageData);
          } else if (imgData.media && imgData.reply_id) {
            if (imgData.type === 'image') {
              var imageData = {type: 'reply', image: imgData.media, data: imgData};
            } else {
              var imageData = {type: 'reply', video: imgData.media, data: imgData};
            }
            images.push(imageData);
          } else if (imgData.media && imgData.comment_id) {
            if (imgData.type === 'image') {
              var imageData = {type: 'comment', image: imgData.media, data: imgData};
            } else {
              var imageData = {type: 'comment', video: imgData.media, data: imgData};
            }
            images.push(imageData);
          } else if (imgData.media && imgData.review_id) {
            if (imgData.type === 'image') {
              var imageData = {type: 'review', image: imgData.media, data: imgData};
            } else {
              var imageData = {type: 'review', video: imgData.media, data: imgData};
            }
            images.push(imageData);
          }
        });
        if (res[0] && res[0] && res[0]['primary_image_url'] && images.length === 0) {
          var imageData = {type: 'product', image: res[0]['large_image_url'], data: res[0]};
          images.push(imageData);
        }
        callback(err, images);
      }
    });
  };

  // Products.getProductMedia = function(productId, callback) {
  //   async.parallel([
  //     function(cb) {
  //       Products.find({'where': {'id': productId}, 'include':[{'relation':'brandDetail','scope':{'fields':['image_url','name','product_count']}}], 'fields': ['primary_image_url', 'name', 'brand_id']}, function(err, images) {
  //         (err) ? cb(null, err) : cb(null, images);
  //       });
  //     },
  //     function(cb) {
  //       var review_media = Products.app.models.review_media;
  //       review_media.find({
  //         'where': {'product_id': productId},
  //         'include': [
  //           {'relation': 'userDetail', 'scope': {'fields': ['first_name', 'last_name', 'facebook_id']}},
  //           {'relation': 'reviewDetail', 'scope': {'fields': ['review', 'rating', 'created']}},
  //           {'relation': 'commentDetail', 'scope': {'fields': ['comment', 'created']}},
  //           {'relation': 'replyDetail', 'scope': {'fields': ['reply', 'created']}},
  //         ],
  //         'fields': ['media', 'type']}, function(err, images) {
  //           (err) ? cb(null, err) : cb(null, images);
  //       });
  //     },
  //     function(cb) {
  //       var Reviewcomments = Products.app.models.review_comments;
  //       Reviewcomments.find({
  //         'where': {'product_id': productId},
  //         'include': [
  //           {'relation': 'userDetail', 'scope': {'fields': ['first_name', 'last_name', 'facebook_id']}},
  //           {'relation': 'reviewDetail', 'scope': {'fields': ['rating']}},
  //         ],
  //         'fields': ['image_url', 'video_url', 'user_id', 'review_id', 'comment', 'created']}, function(err, images) {
  //         (err) ? cb(null, err) : cb(null, images);
  //       });
  //     },
  //     function(cb) {
  //       var Reviewcommentreply = Products.app.models.review_comment_reply;
  //       Reviewcommentreply.find({'where': {'product_id': productId},
  //         'include': [
  //           {'relation': 'userDetail', 'scope': {'fields': ['first_name', 'last_name', 'facebook_id']}},
  //           {'relation': 'reviewDetail', 'scope': {'fields': ['rating']}},
  //         ],
  //         'fields': ['image_url', 'video_url', 'user_id', 'review_id', 'reply', 'created']}, function(err, images){
  //           (err) ? cb(null, err) : cb(null, images);
  //       });
  //     },
  //   ], function(err, res) {
  //     var images = [];
  //     if (res[0] && res[0][0] && res[0][0]['primary_image_url']) {
  //       var imageData = {type: 'product', image: res[0][0]['primary_image_url'], data: res[0][0]};
  //       images.push(imageData);
  //     }
  //     if (res[1]) {
  //       res[1].map(function(data) {
  //         if (data.image_url && data.image_url != '') {
  //           var imageData = {type: 'review', image: data.image_url, data: data};
  //           images.push(imageData);
  //         }
  //         if (data.video_url && data.video_url != '') {
  //           var imageData = {type: 'review', video: data.video_url, data: data};
  //           images.push(imageData);
  //         }
  //       });
  //     }
  //     if (res[2]) {
  //       res[2].map(function(data) {
  //         if (data.image_url && data.image_url != '') {
  //           var imageData = {type: 'comment', image: data.image_url, data: data};
  //           images.push(imageData);
  //         }
  //         if (data.video_url && data.video_url != '') {
  //           var imageData = {type: 'comment', video: data.video_url, data: data};
  //           images.push(imageData);
  //         }
  //       });
  //     }
  //     if (res[3]) {
  //       res[3].map(function(data) {
  //         if (data.image_url && data.image_url != '') {
  //           var imageData = {type: 'reply', image: data.image_url, data: data};
  //           images.push(imageData);
  //         }
  //         if (data.video_url && data.video_url != '') {
  //           var imageData = {type: 'reply', video: data.video_url, data: data};
  //           images.push(imageData);
  //         }
  //       });
  //     }
  //     callback(err, images);
  //   });
  // };

  Products.updateProductBrandId = function(cb) {
    async.parallel([
      function(cbk) {
        var Brands = Products.app.models.Brands;
        var filter = {
          'fields': ['name', 'id'],
        };
        Brands.find(filter, function(err, brands) {
          if (err) {
            cbk(err);
          } else {
            cbk(null, brands);
          }
        });
      }], function(err, res) {
      var totalbrand = 0;
      res[0].forEach(function(brand, key) {
        var obj = {'brand_id': ObjectId(brand.id)};
        Products.updateAll({'brand_name': brand.category_name}, obj);
        totalbrand ++;
      });
      if (res[0].length === totalbrand) {
        cb(null, true);
      }
    });
  };

  Products.updateProductCategoryId = function(cb) {
    async.parallel([
      function(cbk) {
        var Categories = Products.app.models.Categories;
        var filter = {
          'fields': ['name', 'id'],
        };
        Categories.find(filter, function(err, category) {
          if (err) {
            cbk(err);
          } else {
            cbk(null, category);
          }
        });
      }], function(err, res) {
      var totalbrand = 0;
      res[0].forEach(function(category, key) {
        var obj = {'category_id': ObjectId(category.id)};
        Products.updateAll({'category_name': category.name}, obj);
        totalbrand ++;
      });
      if (res[0].length === totalbrand) {
        cb(null, true);
      }
    });
  };

  Products.updateProductStoreId = function(cb) {
      async.parallel([
        function(cbk)
        {
          var Stores = Products.app.models.Stores;
          Stores.find(function(err, store) {
            if (err) {
              cbk(err);
            } else {
              cbk(null, store);
            }
          });
        }
      ], function(err, res) {
        var totalbrand = 0;
        res[0].forEach(function(store, key) {
          var obj = {'store_id': ObjectId(store._id)};
          Products.updateAll({'store_name' : store.name}, obj);
          totalbrand ++;
        });
        if (res[0].length === totalbrand) {
          cb(null, true);
        }
      });
  };

  Products.updateProductDepartmentId = function(cb) {
    async.parallel([
      function(cbk) {
        var Departments = Products.app.models.Departments;
        Departments.find(function(err, department) {
          if (err) {
            cbk(err);
          } else {
            cbk(null, department);
          }
        });
      },
    ], function(err, res) {
      var totalbrand = 0;
      res[0].forEach(function(department, key) {
        var obj = {'department_id': ObjectId(department.id)};
        Products.updateAll({'department_name': department.name}, obj);
        totalbrand ++;
      });
      if (res[0].length === totalbrand) {
        cb(null, true);
      }
    });
  };

  Products.updateViewAndRating = function(cb) {
    var obj = {'total_views': 0, 'overall_rating': 0};
    Products.updateAll({}, obj);
  };

  Products.refinementsByTags = function(tags, name, queryTags = '', offset = 0, limit = 50, callback) {
    name = decodeURIComponent(name);
    queryTags = decodeURIComponent(queryTags);
    if (tags == 'by_brand') {
      var optData = createQueryDefinition(tags, name, queryTags, offset, 'by_brand', 'b', limit);
    } else if (tags == 'by_category') {
      var optData = createQueryDefinition(tags, name, queryTags, offset, 'by_category', 'c', limit);
    } else if (tags == 'by_department') {
      var optData = createQueryDefinition(tags, name, queryTags, offset, 'by_department', 'd', limit);
    } else if(tags == 'by_diet_type') {
      var optData = createQueryDefinition(tags, name, queryTags, offset, 'by_diet_type', 't', limit);
    } else if(tags == 'by_category') {
      var optData = createQueryDefinition(tags, name, queryTags, offset, 'by_category', 'c', limit);
    } else  {
      var optData = createQueryDefinition(tags, name, queryTags, offset, '/');
    }
    
    var pagingDef = parseInt(offset) + parseInt(limit);

    var _apiUrl = 'http://' + Products.app.get('host') + ':' + Products.app.get('port') +  Products.app.get('restApiRoot');
    
    getProductsByTags(optData, function(err, results) {
      var paging = {
        next: _apiUrl + '/products/refinementsByTags' + optData.path+'&offset=' + pagingDef + '&limit=' + limit,
        count: results.productCount,
        offset: pagingDef ? pagingDef - limit : 0,
        hasPaging: (results.productCount > pagingDef) ? true : false,
      };
      callback(null, {
        data: results.products,
        filters: results.filters,
        tags: results.tags,
        paging: paging,
      });
    });
  };

  function getProductsByTags(queryDefinition, callback) {
    var paging = queryDefinition.paging || 0;
    var limit = queryDefinition.limit || 10;
  
    var allTags = queryDefinition.refinementTags.map(t => t);
    if (queryDefinition.tag) allTags.push(queryDefinition.tag);
    allTags = _.uniq(allTags);
    async.parallel([
      function(cb) {
        listByTags(allTags, paging, limit,  function(err, resp) {
          cb(null, resp);
        });
      },
      function(cb) {
        if (queryDefinition.tag) {
          refinProductByTags(allTags, function(err, data) {
            cb(null, data);
          });
        } else {
          refinProductByTags([], function(err, data) {
            cb(null, data);
          });
        }
      },
    ], function(err, results) {
      if (err) return callback(null, err);
      var filters = {
        brands: results[1].brands,
        categories: results[1].categories,
        departments: results[1].departments,
        diet_types: results[1].diet_types,
        stores: results[1].stores,
      };
  
      return callback(null, {
        products: results[0],
        filters: filters,
        tags: results[1].tags,
        productCount: results[1].productCount,
      });
    });
  }

  function refinProductByTags(tag, callback) {
    var match =  tag && tag.length > 0 ? {tags: {$all: tag}} : {};
    Products.getDataSource().connector.connect(function(err, db) {
      var col = db.collection('products');
      col.aggregate([
        {$match: match},
        {$limit: 1000},
        {$facet: refineFacet},
      ]).toArray(function(err, arr) {
        if (err) callback(null, err);
        if (arr && arr.length == 0) callback(null, {'message': 'Aggregation did not return any results.'});
        var categories = arr[0].categories.map(convertDbFilterToResponseFilter);
        var departments = arr[0].departments.map(convertDbFilterToResponseFilter);
        var brands = arr[0].brands.map(convertDbFilterToResponseFilter);
        var stores = arr[0].stores.map(convertDbFilterToResponseFilter);
        var dbDietTypeTags = arr[0].diet_type_tags;
        var responseDietTypeTags = convertDbTagsToResponseTags(dbDietTypeTags);
        var dbTags = arr[0].tags;
        var responseTags = convertDbTagsToResponseTags(dbTags);
        var productCount = (arr[0].productCount.length) ? arr[0].productCount[0].count : 0;
        
        callback(null, {
          categories: categories,
          departments: departments,
          brands: brands,
          stores: stores,
          general: generalTabsOptipns,
          diet_types: responseDietTypeTags,
          tags: responseTags,
          productCount: productCount,
        });
      });
    });
  }

  function listByTags(tags, paging = 0, limit = 10, callback) {
    var query = [];
    if (tags && tags.length > 0) {
      tags.forEach(function(val, key) {
        query.push({'tags': val});
      });
    };
    Products.find({'where': {'and': query}, 'fields': ['primary_image_url', 'category_name', 'large_image_url', 'store_name', 'name', 'calories', 'store_id', 'id', 'brand_name'], 'offset': paging, 'limit': limit}, function(err, arr) {
      callback(null, arr);
    });
  }

  function convertDbFilterToResponseFilter(dbFilter) {
    return {'name': dbFilter._id, 'count': dbFilter.count};
  };

  function convertDbTagsToResponseTags(tags) {
    return tags.map(function(tag) {
      return {
        type: getTagType(tag.name),
        name: tag.name.substring(2),
        count: tag.count,
      };
    });
  };

  function createQueryDefinition(tags, name, queryTags, offset = 0, path, tagPrefix, limit = 10) {
    var refinementTags = [];
    if (queryTags) {
      refinementTags = getRefinementTags(queryTags);
    }
    
    var tag = name ? (tagPrefix + ':' + name) : null;
    var paging = parseInt(offset || '0');

    var apiUrl = '';
    if (name)  {
      apiUrl += '?tags=' + path + '&name=' + encodeURIComponent(name);
    }
    if (queryTags)  {
      apiUrl += '&queryTags=' + encodeURIComponent(queryTags);
    }
    //tag = _.uniq(tag);
    return {
      tag: tag,
      name: name,
      path: apiUrl,
      paging: paging,
      limit: limit,
      queryTags: queryTags,
      refinementTags: refinementTags,
    };
  }

  function getRefinementTags(queryTags) {
    var sections = (queryTags || '').split(',');
    return sections
      .filter(function(section) {
        return section && section.length > 0;
      }).map(function(section, key) {
        var parts = section.split(':');
        if (parts[0] !== 'general') {
          var firstChar =
            parts[0] == 'brand' ? 'b' :
            parts[0] == 'department' ? 'd' :
            parts[0] == 'category' ? 'c' :
            parts[0] == 'diet_type' ? 't' :
            parts[0] == 'store' ? 's' : null;
          var name = parts[1];
          return firstChar + ':' + name;
        }
      });
  }

  function getRefinementGeneralTags(queryTags) {
    var sections = (queryTags || '').split(',');
    return sections
      .filter(function(section) {
        return section && section.length > 0;
      }).map(function(section) {
        var parts = section.split(':');
        if(parts[0] == 'general')
        {
          return parts[1];
        } 
      });
  }

  function getTagType(dbTagName) {
    var firstChar = dbTagName.charAt(0);
    if (firstChar == 's') return 'store';
    if (firstChar == 'b') return 'brand';
    if (firstChar == 'c') return 'category';
    if (firstChar == 't') return 'diet_type';
    if (firstChar == 'd') return 'department';
    return null;
  }

  Products.getProductSocailData = function(productId, userId, callback) {
    if (productId && userId) {
      async.parallel([
        function(cb) {
          var Favorites = Products.app.models.favorites;
          Favorites.count({'product_id': productId, 'user_id': userId}, function(err, data) {
            if (err) {
              cb(null, err);
            } else {
              cb(null, data);
            }
          });
        },
        function(cb) {
          var Tryproducts = Products.app.models.try_products;
          Tryproducts.count({'product_id': productId, 'user_id': userId}, function(err, data) {
            if (err) {
              cb(null, err);
            } else {
              cb(null, data);
            }
          });
        },
      ], function(err, res) {
        if (err) {
          callback(null, err);
        } else {
          var data = {favorite: res[0], tryIt: res[1]};
          callback(null, data);
        }
      });
    } else {
      callback(null, null);
    }
  };

  Products.getProductRelatedData = function(productId, callback) {
    Products.findOne({'where': {'id': productId}, 'include': [{'relation': 'brandDetail', 'scope': {'fields': ['image_url', 'name', 'product_count']}}], 'fields': ['brand_id', 'name']}, function(err, data) {
      callback(null, data);
    });
  };

  Products.searchData = function(keyword, filters, userId = '', offset = 0, limit = 10, callback) {
    var query = [];
    var conditions = {};
    var generalTags = [];
    var productConditions = {};
    productConditions.name = conditions.name =  {'like': `${decodeURIComponent(keyword)}`, 'options': 'mi'};
    
    if (filters) {
      var tags = getRefinementTags(filters);
      if (tags && tags.length > 0) {
        tags.forEach(function(val, key) {
          if (val) {
            (val) ? query.push({'tags': val}) : '';
          }
        });
        if (query && query.length) {
          productConditions = conditions = merge(conditions, {'and': query});
        }
      };

      var generalTagsList = getRefinementGeneralTags(filters);
      if (generalTagsList && generalTagsList.length > 0) {
        generalTagsList.forEach(function(val, key) {
          (val) ? generalTags.push(val) : '';
        });
      };
    } else  {
      productConditions.tags = {'inq': ['t:Vegan', 't:Gluten Free', 't:Paleo', 't:GLow Fat', 't:Fat Free', 't:Low Carb', 't:Alcoholic']};
    }

    async.parallel([
      function(cb) {
        cb(null, []);
      },
      function(cb) {
        if (generalTags.length === 0 || (generalTags.length && generalTags.indexOf('Brand') > -1)) {
          var Brands = Products.app.models.Brands;
          Brands.find({'where': conditions, 'fields': ['image_url', 'name', 'product_count', 'slug', 'id', 'type'], 'order': 'product_count DESC', 'offset': offset, 'limit': limit}, function(err, data) {
            if (err) {
              cb(null, err);
            } else {
              if (data.length) {
                data.forEach(function(val, key) {
                  productConditions.tags.inq.push('b:'+val.name);
                });
              }
              cb(null, data);
            }
          });
        } else {
          cb(null, []);
        }
      },
      function(cb) {
        if (generalTags.length === 0 || (generalTags.length && generalTags.indexOf('Category') > -1)) {
          var Categories = Products.app.models.Categories;
          Categories.find({'where': conditions, 'fields': ['image_url', 'name', 'product_count', 'id', 'type'], 'order': 'product_count DESC', 'offset': offset, 'limit': limit}, function(err, data) {
            if (err) {
              cb(null, err);
            } else {
              if (data.length) {
                data.forEach(function(val, key) {
                  productConditions.tags.inq.push('c:'+val.name);
                });
              }
              cb(null, data);
            }
          });
        } else {
          cb(null, []);
        }
      },
      function(cb) {
        if (generalTags.length === 0 || (generalTags.length && generalTags.indexOf('People') > -1)) {
          var Users = Products.app.models.Users;
          Users.find({'where': {'name': {'like': `${decodeURIComponent(keyword)}`, 'options': 'mi'}, 'id': {'neq': userId}}, 'fields': ['first_name', 'last_name', 'facebook_id', 'name', 'id', 'total_review', 'total_media', 'total_following', 'total_follower'], 'order': 'username ASC', 'offset': offset, 'limit': limit}, function(err, data) {
            if (err) {
              cb(null, err);
            } else {
              cb(null, data);
            }
          });
        } else {
          cb(null, []);
        }
      },
      function(cb) {
        if (generalTags.length === 0 || (generalTags.length && generalTags.indexOf('Department') > -1)) {
          var Departments = Products.app.models.Departments;
          Departments.find({'where': {'name': {'like': `${decodeURIComponent(keyword)}`, 'options': 'mi'}, 'id': {'neq': userId}}, 'fields': ['image_url', 'name', 'product_count', 'id', 'type'], 'order': 'username ASC', 'offset': offset, 'limit': limit}, function(err, data) {
            if (err) {
              cb(null, err);
            } else {
              if (data.length) {
                data.forEach(function(val, key) {
                  productConditions.tags.inq.push('d:'+val.name);
                });
              }
              cb(null, data);
            }
          });
        } else {
          cb(null, []);
        }
      },
      function(cb) {
        if (generalTags.length === 0 || (generalTags.length && generalTags.indexOf('DietType') > -1)) {
          var DietTypes = Products.app.models.DietTypes;
          DietTypes.find({'where': {'name': {'like': `${decodeURIComponent(keyword)}`, 'options': 'mi'}, 'id': {'neq': userId}}, 'fields': ['image_url', 'name', 'product_count', 'id', 'type'], 'order': 'username ASC', 'offset': offset, 'limit': limit}, function(err, data) {
            if (err) {
              cb(null, err);
            } else {
              if (data.length) {
                data.forEach(function(val, key) {
                  productConditions.tags.inq.push('t:'+val.name);
                });
              }
              cb(null, data);
            }
          });
        } else {
          cb(null, []);
        }
      },
      function(cb) {
        if (userId) {
          var favorites = Products.app.models.favorites;
          favorites.find({'where': {'user_id': userId}, 'fields': ['item_id']}, function(err, favList) {
            if (favList && favList.length) {
              var plist = [];
              favList.forEach(function(list, key) {
                plist.push(list['item_id'].toString());
                if (key == favList.length - 1) {
                  cb(null, plist);
                }
              });
            } else {
              cb(null, err);
            }
          });
        } else {
          cb(null, null);
        }
      },
      function(cb) {
        if (userId) {
          var Follow = Products.app.models.Follow;
          var newObj = {'where': {'following_user_id': userId}, 'fields': ['follower_user_id']};
          Follow.find(newObj, function(err, data) {
            if (data && data.length) {
              var plist = [];
              data.forEach(function(list, key) {
                plist.push(list['follower_user_id'].toString());
                if (key == data.length - 1) {
                  cb(null, plist);
                }
              });
            } else {
              cb(null, err);
            }
          });
        } else {
          cb(null, null);
        }
      },
    ], function(err, res) {
      //console.log(res);
      //var respose = {};
      if (err) {
        callback(null, err);
      } else {
        var searchData = [];
        var productOrConditions = [];
        // if (res[0].length) {
        //   searchData = searchData.concat(res[0]);
        // }
        if  (res[1].length) {
          searchData = searchData.concat(res[1]);
        }
        if  (res[2].length) {
          searchData = searchData.concat(res[2]);
        }
        if  (res[4].length) {
          searchData = searchData.concat(res[4]);
        }
        if  (res[5].length) {
          searchData = searchData.concat(res[5]);
        }

        if  (res[3].length) {
          if (res[7] && res[7].length) {
            res[3].forEach(function(list, key) {
              if (res[7].indexOf(list['id'].toString()) > -1) {
                res[3][key]['already_follow'] = true;
              } else {
                res[3][key]['already_follow'] = false;
              }
            });
          }
          searchData = searchData.concat(res[3]);
        }
        if (res[6] && res[6].length) {
          searchData.forEach(function(list, key) {
            if (res[6].indexOf(list['id'].toString()) > -1) {
              searchData[key]['favorite'] = true;
            } else {
              searchData[key]['favorite'] = false;
            }
          });
        }
        if (generalTags.length === 0 || (generalTags.length && generalTags.indexOf('Product') > -1)) {
          Products.find({'where': productConditions, 'include': [{'relation': 'storeDetail'}], 'fields': ['primary_image_url', 'name', 'brand_name', 'id', 'store_id', 'calories'], 'order': 'name ASC', 'offset': offset, 'limit': limit}, function(err, data) {
            if (data.length) {
              searchData = searchData.concat(data);
            }
            callback(null, _.sortBy(searchData, function(a) { return a.name.toLowerCase(); }));
          });
        } else {
          callback(null, _.sortBy(searchData, function(a) { return a.name.toLowerCase(); }));
        }
      }
    });
  };

  Products.autocompletData = function(keyword, filters, action = '', limit = '', callback) {
    var query = [];
    var conditions = {};
    var productConditions = {};
    var generalTags = [];
    if (filters) {
      var tags = getRefinementTags(filters);
      if (tags && tags.length > 0) {
        tags.forEach(function(val, key) {
          if (val) {
            (val) ? query.push({'tags': val}) : '';
          }
        });
        if (query && query.length) {
          productConditions  = merge(conditions, {'and': query});
        }
      }
      var generalTagsList = getRefinementGeneralTags(filters);
      if (generalTagsList && generalTagsList.length > 0) {
        generalTagsList.forEach(function(val, key) {
          (val) ? generalTags.push(val) : '';
        });
      };
    } else {
      productConditions = {'tags': {'inq': ['t:Vegan', 't:Gluten Free', 't:Paleo', 't:GLow Fat', 't:Fat Free', 't:Low Carb', 't:Alcoholic']}};
    }
    async.parallel([
      function(cb) {
        if (generalTags.length === 0 || (generalTags.length && generalTags.indexOf('Product') > -1)) {
          Products.find({'where': productConditions, 'fields': ['primary_image_url', 'name', 'brand_name', 'id'], 'order': 'name ASC', 'offset': 0, 'limit': limit}, function(err, data) {
            if (err) {
              cb(null, err);
            } else {
              cb(null, data);
            }
          });
        } else {
          cb(null, []);
        }
      },
      function(cb) {
        if (generalTags.length === 0 || (generalTags.length && generalTags.indexOf('Brand') > -1)) {
          var Brands = Products.app.models.Brands;
          Brands.find({'fields': ['image_url', 'name', 'product_count', 'slug', 'id'], 'order': 'product_count DESC', 'offset': 0, 'limit': limit}, function(err, data) {
            if (err) {
              cb(null, err);
            } else {
              cb(null, data);
            }
          });
        } else {
          cb(null, []);
        }
      },
      function(cb) {
        if (generalTags.length === 0 || (generalTags.length && generalTags.indexOf('Category') > -1)) {
          var Categories = Products.app.models.Categories;
          Categories.find({'fields': ['image_url', 'name', 'product_count', 'id'], 'order': 'product_count DESC', 'offset': 0, 'limit': limit}, function(err, data) {
            if (err) {
              cb(null, err);
            } else {
              cb(null, data);
            }
          });
        } else {
          cb(null, []);
        }
      },
      function(cb) {
        if ((action !== 'review') && (generalTags.length === 0 || (generalTags.length && generalTags.indexOf('People') > -1))) {
          var Users = Products.app.models.Users;
          Users.find({'fields': ['facebook_id', 'name', 'id'], 'order': 'username ASC', 'offset': 0, 'limit': limit}, function(err, data) {
            if (err) {
              cb(null, err);
            } else {
              cb(null, data);
            }
          });
        } else {
          cb(null, []);
        }
      },
    ], function(err, res) {
      if (err) {
        callback(null, err);
      } else {
        var searchData = [];
        if (res[0].length) {
          searchData = searchData.concat(res[0]);
        }
        if  (res[1].length) {
          searchData = searchData.concat(res[1]);
        }
        if  (res[2].length) {
          searchData = searchData.concat(res[2]);
        }
        if  (res[3].length) {
          searchData = searchData.concat(res[3]);
        }
        callback(null, _.sortBy(searchData, function(a) { return a.name.toLowerCase()}));
      }
    });
  };


  Products.searchDataCount = function(keyword, filters, userId = '', callback) {
    var query = [];
    var conditions = {};
    var generalTags = [];
    var productConditions = {};
    var filterApplied = false;
    productConditions.name = conditions.name =  {'like': `${decodeURIComponent(keyword)}`, 'options': 'mi'};
    if (filters) {
      filterApplied = true;
      var tags = getRefinementTags(filters);
      if (tags && tags.length > 0) {
        tags.forEach(function(val, key) {
          if (val) {
            (val) ? query.push({'tags': val}) : '';
          }
        });
        if (query && query.length) {
          productConditions = merge(conditions, {'and': query});
        }
      };

      var generalTagsList = getRefinementGeneralTags(filters);
      if (generalTagsList && generalTagsList.length > 0) {
        generalTagsList.forEach(function(val, key) {
          (val) ? generalTags.push(val) : '';
        });
      };
    } else  {
      productConditions.tags = {"inq": ["t:Vegan", "t:Gluten Free", "t:Paleo", "t:GLow Fat", "t:Fat Free", "t:Low Carb", "t:Alcoholic"]};
    }
    async.parallel([
      function(cb) {
        cb(null, []);
      },
      function(cb) {
        if (generalTags.length === 0 || (generalTags.length && generalTags.indexOf('Brand') > -1)) {
          var Brands = Products.app.models.Brands;
          Brands.find({'where': conditions, 'fields': ['id', 'name']}, function(err, data) {
            if (err) {
              cb(null, err);
            } else {
              if (data.length) {
                data.forEach(function(val, key) {
                  productConditions.tags.inq.push('b:'+val.name);
                });
              }
              cb(null, data);
            }
          });
        } else {
          cb(null, []);
        }
      },
      function(cb) {
        if (generalTags.length === 0 || (generalTags.length && generalTags.indexOf('Category') > -1)) {
          var Categories = Products.app.models.Categories;
          Categories.find({'where': conditions, 'fields': ['id', 'name']}, function(err, data) {
            if (err) {
              cb(null, err);
            } else {
              if (data.length) {
                data.forEach(function(val, key) {
                  productConditions.tags.inq.push('c:'+val.name);
                });
              }
              cb(null, data);
            }
          });
        } else {
          cb(null, []);
        }
      },
      function(cb) {
        if (generalTags.length === 0 || (generalTags.length && generalTags.indexOf('People') > -1)) {
          var Users = Products.app.models.Users;
          Users.count({'name': {'like': `${decodeURIComponent(keyword)}`, 'options': 'mi'}, 'id': {'neq': userId}}, function(err, data) {
            if (err) {
              cb(null, err);
            } else {
              cb(null, data);
            }
          });
        } else {
          cb(null, []);
        }
      },
      function(cb) {
        if (generalTags.length === 0 || (generalTags.length && generalTags.indexOf('Department') > -1)) {
          var Departments = Products.app.models.Departments;
          Departments.find({'where': conditions, 'fields': ['id', 'name']}, function(err, data) {
            if (err) {
              cb(null, err);
            } else {
              if (data.length) {
                data.forEach(function(val, key) {
                  productConditions.tags.inq.push('d:'+val.name);
                });
              }
              cb(null, data);
            }
          });
        } else {
          cb(null, []);
        }
      },
      function(cb) {
        if (generalTags.length === 0 || (generalTags.length && generalTags.indexOf('DietType') > -1)) {
          var DietTypes = Products.app.models.DietTypes;
          DietTypes.find({'where': conditions, 'fields': ['id', 'name']}, function(err, data) {
            if (err) {
              cb(null, err);
            } else {
              if (data.length) {
                data.forEach(function(val, key) {
                  productConditions.tags.inq.push('t:'+val.name);
                });
              }
              cb(null, data);
            }
          });
        } else {
          cb(null, []);
        }
      },
    ], function(err, res) {
      var count = 0;
      var productOrConditions = [];
      if (err) {
        callback(null, err);
      } else {
        if  (res[1] && res[1].length) {
          count += res[1].length;
        }
        if  (res[2] && res[2].length) {
          count += res[2].length;
        }
        if  (res[3]) {
          count += res[3];
        }
        if  (res[4] && res[4].length) {
          count += res[4].length;
        }
        if  (res[5] && res[5].length) {
          count += res[5].length;
        }
        if (generalTags.length === 0 || (generalTags.length && generalTags.indexOf('Product') > -1)) {
          Products.count(productConditions, function(err, data) {
            if (err) {
              callback(null, count);
            } else {
              callback(null, count + data);
            }
          });
        } else {
          callback(null, count);
        }
      }
    });
  };

  Products.getFilters = function(action = '', callback) {
    refinProductByTags([], function(err, data) {
      if  (err) {
        callback(null, err);
      } else {
        if (action === 'review') {
          data['general'].splice(0, 1);
        }
        delete data['brands'];
        delete data['stores'];
        callback(null, data);
      }
    });
  };

  Products.searchActivityFeed = function(keyword, filters, userId = '', offset = 0, limit = 10, callback) {
    var query = [];
    var conditions = {};
    var generalTags = [];
    var productConditions = {};
    if (keyword) {
      productConditions.name = conditions.name =  {'like': `${decodeURIComponent(keyword)}`, 'options': 'mi'};
    }
    var Useractivities = Products.app.models.user_activities;
    if (filters) {
      var tags = getRefinementTags(filters);
      if (tags && tags.length > 0) {
        tags.forEach(function(val, key) {
          if (val) {
            (val) ? query.push({'tags': val}) : '';
          }
        });
        if (query && query.length) {
          productConditions = conditions = merge(conditions, {'and': query});
        }
      };

      var generalTagsList = getRefinementGeneralTags(filters);
      if (generalTagsList && generalTagsList.length > 0) {
        generalTagsList.forEach(function(val, key) {
          (val) ? generalTags.push(val) : '';
        });
      };
    } else  {
      productConditions.tags = {'inq': ['t:Vegan', 't:Gluten Free', 't:Paleo', 't:GLow Fat', 't:Fat Free', 't:Low Carb', 't:Alcoholic']};
    }

    async.parallel([
      function(cb) {
        if (generalTags.length === 0 || (generalTags.length && generalTags.indexOf('Product') > -1)) {
          async.parallel([
            function(cb2) {
              Products.find({'where': productConditions, 'fields': ['id']}, function(err, data) {
                if (err) {
                  cb2(null, err);
                } else {
                  cb2(null, data);
                }
              });
            },
          ], function(err, res) {
            if (err) {
              cb(null, err);
            } else {
              if (res[0] && res[0].length) {
                var pids = [];
                res[0].forEach(function(val, key) {
                  pids.push(val.id);
                });
                cb(null, pids);
              } else {
                cb(null, res[0]);
              }
            }
          });
        } else {
          cb(null, []);
        }
      },
      function(cb) {
        if (generalTags.length === 0 || (generalTags.length && generalTags.indexOf('Brand') > -1)) {
          async.parallel([
            function(cb2) {
              var Brands = Products.app.models.Brands;
              Brands.find({'where': conditions, 'fields': ['id']}, function(err, data) {
                if (err) {
                  cb2(null, err);
                } else {
                  cb2(null, data);
                }
              });
            },
          ], function(err, res) {
            if (err) {
              cb(null, err);
            } else {
              if (res[0] && res[0].length) {
                var pids = [];
                res[0].forEach(function(val, key) {
                  pids.push(val.id);
                });
                cb(null, pids);
              } else {
                cb(null, res[0]);
              }
            }
          });
        } else {
          cb(null, []);
        }
      },
      function(cb) {
        if (generalTags.length === 0 || (generalTags.length && generalTags.indexOf('Category') > -1)) {
          async.parallel([
            function(cb2) {
              var Categories = Products.app.models.Categories;
              Categories.find({'where': conditions, 'fields': ['id']}, function(err, data) {
                if (err) {
                  cb2(null, err);
                } else {
                  cb2(null, data);
                }
              });
            },
          ], function(err, res) {
            if (err) {
              cb(null, err);
            } else {
              if (res[0] && res[0].length) {
                var pids = [];
                res[0].forEach(function(val, key) {
                  pids.push(val.id);
                });
                cb(null, pids);
              } else {
                cb(null, res[0]);
              }
            }
          });
        } else {
          cb(null, []);
        }
      },
      function(cb) {
        if (generalTags.length === 0 || (generalTags.length && generalTags.indexOf('People') > -1)) {
          async.parallel([
            function(cb2) {
              var Users = Products.app.models.Users;
              Users.find({'where': {'name': {'like': `${decodeURIComponent(keyword)}`, 'options': 'mi'}, /*'id': {'neq': userId} */}, 'fields': ['id']}, function(err, data) {
                if (err) {
                  cb2(null, err);
                } else {
                  cb2(null, data);
                }
              });
            },
          ], function(err, res) {
            if (err) {
              cb(null, err);
            } else {
              if (res[0] && res[0].length) {
                var pids = [];
                res[0].forEach(function(val, key) {
                  pids.push(val.id);
                });
                cb(null, pids);
              } else {
                cb(null, res[0]);
              }
            }
          });
        } else {
          cb(null, []);
        }
      },
      function(cb) {
        if (generalTags.length === 0 || (generalTags.length && generalTags.indexOf('Department') > -1)) {
          async.parallel([
            function(cb2) {
              var Departments = Products.app.models.Departments;
              Departments.find({'where': {'name': {'like': `${decodeURIComponent(keyword)}`, 'options': 'mi'}}, 'fields': ['id']}, function(err, data) {
                if (err) {
                  cb2(null, err);
                } else {
                  cb2(null, data);
                }
              });
            },
          ], function(err, res) {
            if (err) {
              cb(null, err);
            } else {
              if (res[0] && res[0].length) {
                var pids = [];
                res[0].forEach(function(val, key) {
                  pids.push(val.id);
                });
                cb(null, pids);
              } else {
                cb(null, res[0]);
              }
            }
          });
        } else {
          cb(null, []);
        }
      },
      function(cb) {
        if (generalTags.length === 0 || (generalTags.length && generalTags.indexOf('Department') > -1)) {
          async.parallel([
            function(cb2) {
              var DietTypes = Products.app.models.DietTypes;
              DietTypes.find({'where': {'name': {'like': `${decodeURIComponent(keyword)}`, 'options': 'mi'}}, 'fields': ['id']}, function(err, data) {
                if (err) {
                  cb2(null, err);
                } else {
                  cb2(null, data);
                }
              });
            },
          ], function(err, res) {
            if (err) {
              cb(null, err);
            } else {
              if (res[0] && res[0].length) {
                var pids = [];
                res[0].forEach(function(val, key) {
                  pids.push(val.id);
                });
                cb(null, pids);
              } else {
                cb(null, res[0]);
              }
            }
          });
        } else {
          cb(null, []);
        }
      },
    ], function(err, res) {
      var productConditions = [];
      if (err) {
        callback(null, err);
      } else {
        var searchData = [];
        if (res[0].length) {
          productConditions.push({product_id : {inq: res[0]}});
        }
        if  (res[1].length) {
          productConditions.push({brand_id : {inq: res[1]}});
        }
        if  (res[2].length) {
          productConditions.push({category_id : {inq: res[2]}});
        }
        if  (res[3].length) {
          productConditions.push({user_id : {inq: res[3]}});
        }
        if  (res[4].length) {
          productConditions.push({department_id : {inq: res[4]}});
        }
        if  (res[5].length) {
          productConditions.push({diet_type_id : {inq: res[5]}});
        }
        Useractivities.find({'where': {'or': productConditions}, 'include': [
          {'relation': 'productDetail', 'scope': {'fields': ['primary_image_url', 'name', 'brand_name', 'overall_rating', 'total_reviews', 'id']}},
          {'relation': 'brandDetail', 'scope': {'fields': ['image_url', 'name', 'type', 'id']}},
          {'relation': 'categoryDetail', 'scope': {'fields': ['image_url', 'name', 'type', 'id']}},
          {'relation': 'departmentDetail', 'scope': {'fields': ['image_url', 'name', 'type', 'id']}},
          {'relation': 'dietTypeDetail', 'scope': {'fields': ['image_url', 'name', 'type', 'id']}},
          {'relation': 'reviewDetail', 'scope': {'fields': ['review', 'rating', 'user_id', 'comment_count'], 'include': [{'relation': 'userDetail', 'scope': {'fields': ['name', 'facebook_id']}}, {'relation': 'likes', 'scope': {'fields': ['id', 'user_id']}}]}},
          {'relation': 'commentDetail', 'scope': {'fields': ['comment', 'user_id', 'reply_count'], 'include': [{'relation': 'userDetail', 'scope': {'fields': ['name', 'facebook_id']}}, {'relation': 'likes', 'scope': {'fields': ['id', 'user_id']}}]}},
          {'relation': 'mediaDetail', 'scope': {'fields': ['media', 'type']}},
          {'relation': 'userDetail', 'scope': {'fields': ['name', 'facebook_id']}}],
          'fields': ['id', 'product_id', 'brand_id', 'category_id', 'department_id', 'diet_type_id', 'review_id', 'comment_id', 'user_id', 'media_id', 'type', 'activity', 'created'], 'offset': offset, 'limit': limit, 'order': 'created DESC'}, function(err, data) {
          if (err) {
            callback(null, err);
          } else {
            callback(null, data);
          }
        });
      }
    });
  };

  Products.searchActivityFeedCount = function(keyword, filters, userId = '', callback) {
    var query = [];
    var conditions = {};
    var generalTags = [];
    var productConditions = {};
    if (keyword) {
      productConditions.name = conditions.name =  {'like': `${decodeURIComponent(keyword)}`, 'options': 'mi'};
    }
    var Useractivities = Products.app.models.user_activities;
    if (filters) {
      var tags = getRefinementTags(filters);
      if (tags && tags.length > 0) {
        tags.forEach(function(val, key) {
          if (val) {
            (val) ? query.push({'tags': val}) : '';
          }
        });
        if (query && query.length) {
          productConditions = conditions = merge(conditions, {'and': query});
        }
      };

      var generalTagsList = getRefinementGeneralTags(filters);
      if (generalTagsList && generalTagsList.length > 0) {
        generalTagsList.forEach(function(val, key) {
          (val) ? generalTags.push(val) : '';
        });
      };
    } else  {
      productConditions.tags = {'inq': ['t:Vegan', 't:Gluten Free', 't:Paleo', 't:GLow Fat', 't:Fat Free', 't:Low Carb', 't:Alcoholic']};
    }

    async.parallel([
      function(cb) {
        if (generalTags.length === 0 || (generalTags.length && generalTags.indexOf('Product') > -1)) {
          async.parallel([
            function(cb2) {
              Products.find({'where': productConditions, 'fields': ['id']}, function(err, data) {
                if (err) {
                  cb2(null, err);
                } else {
                  cb2(null, data);
                }
              });
            }], function(err, res) {
              if (err) {
                cb(null, err);
              } else {
                if (res[0] && res[0].length) {
                  var pids = [];
                  res[0].forEach(function(val, key) {
                    pids.push(val.id);
                  });
                  cb(null, pids);
                } else {
                  cb(null, res[0]);
                }
              }
            });
        } else {
          cb(null, []);
        }
      },
      function(cb) {
        if (generalTags.length === 0 || (generalTags.length && generalTags.indexOf('Brand') > -1)) {
          async.parallel([
            function(cb2) {
              var Brands = Products.app.models.Brands;
              Brands.find({'where': conditions, 'fields': ['id']}, function(err, data) {
                if (err) {
                  cb2(null, err);
                } else {
                  cb2(null, data);
                }
              });
            }], function(err, res) {
            if (err) {
              cb(null, err);
            } else {
              if (res[0] && res[0].length) {
                var pids = [];
                res[0].forEach(function(val, key) {
                  pids.push(val.id);
                });
                cb(null, pids);
              } else {
                cb(null, res[0]);
              }
            }
          });
        } else {
          cb(null, []);
        }
      },
      function(cb) {
        if (generalTags.length === 0 || (generalTags.length && generalTags.indexOf('Category') > -1)) {
          async.parallel([
            function(cb2) {
              var Categories = Products.app.models.Categories;
              Categories.find({'where': conditions, 'fields': ['id']}, function(err, data) {
                if (err) {
                  cb2(null, err);
                } else {
                  cb2(null, data);
                }
              });
            },
          ], function(err, res) {
            if (err) {
              cb(null, err);
            } else {
              if (res[0] && res[0].length) {
                var pids = [];
                res[0].forEach(function(val, key) {
                  pids.push(val.id);
                });
                cb(null, pids);
              } else {
                cb(null, res[0]);
              }
            }
          });
        } else {
          cb(null, []);
        }
      },
      function(cb) {
        if (generalTags.length === 0 || (generalTags.length && generalTags.indexOf('People') > -1)) {
          async.parallel([
            function(cb2) {
              var Users = Products.app.models.Users;
              Users.find({'where': {'name': {'like': `${decodeURIComponent(keyword)}`, 'options': 'mi'}}, 'fields': ['id']}, function(err, data) {
                if (err) {
                  cb2(null, err);
                } else {
                  cb2(null, data);
                }
              });
            },
          ], function(err, res) {
            if (err) {
              cb(null, err);
            } else {
              if (res[0] && res[0].length) {
                var pids = [];
                res[0].forEach(function(val, key) {
                  pids.push(val.id);
                });
                cb(null, pids);
              } else {
                cb(null, res[0]);
              }
            }
          });
        } else {
          cb(null, []);
        }
      },
      function(cb) {
        if (generalTags.length === 0 || (generalTags.length && generalTags.indexOf('Department') > -1)) {
          async.parallel([
            function(cb2) {
              var Departments = Products.app.models.Departments;
              Departments.find({'where': {'name': {'like': `${decodeURIComponent(keyword)}`, 'options': 'mi'}}, 'fields': ['id']}, function(err, data) {
                if (err) {
                  cb2(null, err);
                } else {
                  cb2(null, data);
                }
              });
            },
          ], function(err, res) {
            if (err) {
              cb(null, err);
            } else {
              if (res[0] && res[0].length) {
                var pids = [];
                res[0].forEach(function(val, key) {
                  pids.push(val.id);
                });
                cb(null, pids);
              } else {
                cb(null, res[0]);
              }
            }
          });
        } else {
          cb(null, []);
        }
      },
      function(cb) {
        if (generalTags.length === 0 || (generalTags.length && generalTags.indexOf('Department') > -1)) {
          async.parallel([
            function(cb2) {
              var DietTypes = Products.app.models.DietTypes;
              DietTypes.find({'where': {'name': {'like': `${decodeURIComponent(keyword)}`, 'options': 'mi'}}, 'fields': ['id']}, function(err, data) {
                if (err) {
                  cb2(null, err);
                } else {
                  cb2(null, data);
                }
              });
            },
          ], function(err, res) {
            if (err) {
              cb(null, err);
            } else {
              if (res[0] && res[0].length) {
                var pids = [];
                res[0].forEach(function(val, key) {
                  pids.push(val.id);
                });
                cb(null, pids);
              } else {
                cb(null, res[0]);
              }
            }
          });
        } else {
          cb(null, []);
        }
      },
    ], function(err, res) {
      var productConditions = [];
      if (err) {
        callback(null, err);
      } else {
        var searchData = [];
        if (res[0].length) {
          productConditions.push({product_id : {inq: res[0]}});
        }
        if  (res[1].length) {
          productConditions.push({brand_id : {inq: res[1]}});
        }
        if  (res[2].length) {
          productConditions.push({category_id : {inq: res[2]}});
        }
        if  (res[3].length) {
          productConditions.push({user_id : {inq: res[3]}});
        }
        if  (res[4].length) {
          productConditions.push({department_id : {inq: res[4]}});
        }
        if  (res[5].length) {
          productConditions.push({diet_type_id : {inq: res[5]}});
        }
        Useractivities.count({'or': productConditions}, function(err, data) {
          if (err) {
            callback(null, err);
          } else {
            callback(null, data);
          }
        });
      }
    });
  };

  Products.homeActivityFeed = function(offset = 0, limit = 0, callback) {
    var Useractivities = Products.app.models.user_activities;
    Useractivities.find({'include': [
      {'relation': 'productDetail', 'scope': {'fields': ['primary_image_url', 'name', 'brand_name', 'overall_rating', 'total_reviews', 'id']}},
      {'relation': 'brandDetail', 'scope': {'fields': ['image_url', 'name', 'type', 'id']}},
      {'relation': 'categoryDetail', 'scope': {'fields': ['image_url', 'name', 'type', 'id']}},
      {'relation': 'departmentDetail', 'scope': {'fields': ['image_url', 'name', 'type', 'id']}},
      {'relation': 'dietTypeDetail', 'scope': {'fields': ['image_url', 'name', 'type', 'id']}},
      {'relation': 'reviewDetail', 'scope': {'fields': ['review', 'rating', 'user_id', 'comment_count'], 'include': [{'relation': 'userDetail', 'scope': {'fields': ['name', 'facebook_id']}}, {'relation': 'likes', 'scope': {'fields': ['id', 'user_id']}}]}},
      {'relation': 'commentDetail', 'scope': {'fields': ['comment', 'user_id', 'reply_count'], 'include': [{'relation': 'userDetail', 'scope': {'fields': ['name', 'facebook_id']}}, {'relation': 'likes', 'scope': {'fields': ['id', 'user_id']}}]}},
      {'relation': 'mediaDetail', 'scope': {'fields': ['media', 'type']}},
      {'relation': 'userDetail', 'scope': {'fields': ['name', 'facebook_id']}}],
      'fields': ['id', 'product_id', 'brand_id', 'category_id', 'department_id', 'diet_type_id', 'review_id', 'comment_id', 'user_id', 'media_id', 'type', 'activity', 'created'], 'offset': offset, 'limit': limit, 'order': 'created DESC'}, function(err, res) {
      if (err) {
        callback(null, err);
      } else {
        callback(null, res);
      }
    });
  };
};
