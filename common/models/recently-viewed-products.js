'use strict';
var async = require('async');
var _ = require('lodash');

module.exports = function(RecentlyViewedproducts) {
  RecentlyViewedproducts.remoteMethod('getWannaTryProducts', {
    http: {path: '/getWannaTryProducts', verb: 'get'},
    accepts: [
      {arg: 'user_id', type: 'string', http: {source: 'query'}, required: true, description: 'User Id is required.'},
    ],
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Get all Wanna try these product',
  });

  RecentlyViewedproducts.remoteMethod('getMyRecentlyViewedproducts', {
    http: {path: '/getMyRecentlyViewedproducts', verb: 'get'},
    accepts: [
      {arg: 'user_id', type: 'string', http: {source: 'query'}, required: true, description: 'User Id is required.'},
      {arg: 'offset', type: 'string', http: {source: 'query'}, description: 'offset for pagination.'},
      {arg: 'limit', type: 'string', http: {source: 'query'}, description: 'limit of pagiantion.'},
    ],
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Get all getMyRecentlyViewedproducts product',
  });

  RecentlyViewedproducts.remoteMethod('getMyRecentlyViewedproductsCount', {
    http: {path: '/getMyRecentlyViewedproductsCount', verb: 'get'},
    accepts: [
      {arg: 'user_id', type: 'string', http: {source: 'query'}, required: true, description: 'User Id is required.'},
    ],
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Get all getMyRecentlyViewedproductsCount product',
  });

  RecentlyViewedproducts.getWannaTryProducts = function(userId, callback) {
    async.parallel([
      function (cb) { 
        RecentlyViewedproducts.find({"where":{"user_id":userId},"fields":["category_id"],"limit" : 10, "order" : "created desc" },function(err, data){
          if(err) {
            cb(null, err);
          } else {
            var ceategories = [];
            data.forEach(function(list, key) {
              if(_.findIndex(ceategories, list['category_id']) == -1)
              {
                ceategories.push(list['category_id']);
              }
              if(key == data.length-1)
              {
                cb(null, ceategories);
              }
              
            });
          }
        });
    }],function(err, res){
      if(res && res[0])
      {
        var products = RecentlyViewedproducts.app.models.products;
        products.find({"where":{"category_id": { inq : res[0]}}, "include":[
          {"relation":"storeDetail"}
        ], "fields":["primary_image_url", "name", "calories", "store_id", "id"],"limit":10}, function(err, productList){
          if(productList)
          {
            callback(null, productList);
          }
          else
          {
            callback(null, err);
          }
        });
      }
      else
      {
        callback(null, null);
      }
    });
  }

  RecentlyViewedproducts.beforeRemote('create', function(context, data, next) {
    if(context.req.body && context.req.body.user_id &&  context.req.body.product_id)
    {
      RecentlyViewedproducts.findOne({"where":{"user_id":context.req.body.user_id,"product_id":context.req.body.product_id}},function(err, data){
        if(data)
        {
          var obj = { created: Date.now()};
          RecentlyViewedproducts.updateAll({"id":data.id}, obj,function(err,userData){
            if(userData)
            {
              var err = new Error('already add but date updated');
                err.status = 200;
                err.statusCode = 200;
                err.code = 'EXIST';
                next(err);
            }
            else{
              next(err);
            }
          })
        }
        else
        {
          next()
        }
      });
    }
  }); 

  
  RecentlyViewedproducts.getMyRecentlyViewedproducts = function(userId, offset, limit, callback) {
    async.parallel([
      function (cb) { 
        offset = (offset) ? offset : 0;
        limit = (limit) ? limit : 10;
        RecentlyViewedproducts.find({"where":{"user_id":userId},"include":[{"relation":"productDetail", "scope":{"fields":["product_id","store_id","primary_image_url","calories","name","brand_name"],"include":[{"relation":"storeDetail"}]}}], "offset":offset, "limit":limit, "order" : "id desc"}, function(err, productList){
          if(err) {
            cb(null, err);
          } else {
            cb(null, productList);
          }
        });
      },
      function (cb) { 
        var favorites = RecentlyViewedproducts.app.models.favorites;
        favorites.find({"where":{"user_id": userId, 'type': 'product'},"fields":['item_id']}, function(err, favList){
          if(favList && favList.length)
          {
            var plist = [];
            favList.forEach(function(list, key) {
              plist.push(list['item_id'].toString());
              if(key == favList.length-1)
              {
                cb(null, plist);
              }
            });
          }
          else
          {
            cb(null, err);
          }
        })
      }],function(err, res){
        //console.log(res);
        if(res && res[0] && res[0].length)
        {
          if(res[1])
          {
            res[0].forEach(function(list, key) {
              if(res[1].indexOf(list['product_id'].toString()) > -1)
              {
                res[0][key]['favorite'] = true;
              }
              else
              {
                res[0][key]['favorite'] = false;
              }
              if(key == res[0].length - 1)
              {
                callback(null, res[0]);
              }
            });
          }
          else{
            callback(null, res[0]);
          }
        }
        else
        {
          callback(null, null);
        }
      });
  };

  RecentlyViewedproducts.getMyRecentlyViewedproductsCount = function(userId,callback) {
    RecentlyViewedproducts.count({"user_id":userId}, function(err, productList){
      if(err) {
        callback(null, err);
      } else {
        callback(null, productList);
      }
    });
  };

};
