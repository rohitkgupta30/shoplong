'use strict';

module.exports = function(product_reviews) {
  var async = require('async');
  var ObjectId = require('mongodb').ObjectID;


  product_reviews.remoteMethod('productReviewAndRating', {
    http: {path: '/productReviewAndRating', verb: 'get'},
    accepts: [
      {arg: 'productId', type: 'string', http: {source: 'query'}, required: true, description: 'Product id is required.'},
      {arg: 'userId', type: 'string', http: {source: 'query'}, description: 'Logged in user id.'},
      {arg: 'offset', type: 'string', http: {source: 'query'}, description: 'paging  offset.'},
      {arg: 'limit', type: 'string', http: {source: 'query'}, description: 'paging  limit.'},
    ],
    returns: {arg: 'result', type: 'string'},
    description: 'Product review  list.',
  });

  product_reviews.remoteMethod('userReviews', {
    http: {path: '/userReviews', verb: 'get'},
    accepts: [
      {arg: 'userId', type: 'string', http: {source: 'query'}, required: true, description: 'User id is required.'},
      {arg: 'offset', type: 'string', http: {source: 'query'}, description: 'paging  offset.'},
      {arg: 'limit', type: 'string', http: {source: 'query'}, description: 'paging  limit.'},
    ],
    returns: {arg: 'result', type: 'string'},
    description: 'User review  list.',
  });

  product_reviews.remoteMethod('userReviewsCount', {
    http: {path: '/userReviewsCount', verb: 'get'},
    accepts: [
      {arg: 'userId', type: 'string', http: {source: 'query'}, required: true, description: 'User id is required.'},
    ],
    returns: {arg: 'result', type: 'string'},
    description: 'User review count.',
  });

  product_reviews.remoteMethod('getReviewComments', {
    http: {path: '/getReviewComments', verb: 'get'},
    accepts: [
      {arg: 'reviewId', type: 'string', http: {source: 'query'}, required: true, description: 'Review id is required.'},
      {arg: 'userId', type: 'string', http: {source: 'query'}, description: 'User id is required.'},
    ],
    returns: {arg: 'result', type: 'string'},
    description: 'User review  list.',
  });

  product_reviews.remoteMethod('getReviewMedia', {
    http: {path: '/getReviewMedia', verb: 'get'},
    accepts: [
      {arg: 'review_id', type: 'string', http: {source: 'query'}, required: true, description: 'Review Id is required.'},
    ],
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Get all media of a review',
  });

  product_reviews.getReviewMedia = function(reviewId, callback) {
    async.parallel([
      function (cb) { 
        product_reviews.find({"where":{"id":reviewId},"fields":["image_url","video_url"]},function(err, images){
          (err) ? cb(null, err) : cb(null, images);
        });
      },
      function (cb) { 
        var Reviewcomments = product_reviews.app.models.review_comments;
        Reviewcomments.find({"where":{"review_id":reviewId},"fields":["image_url","video_url"]},function(err, images){
          (err) ? cb(null, err) : cb(null, images);
        });
      },
      function (cb) { 
        var Reviewcommentreply = product_reviews.app.models.review_comment_reply;
        Reviewcommentreply.find({"where":{"review_id":reviewId},"fields":["image_url","video_url"]},function(err, images){
          (err) ? cb(null, err) : cb(null, images);
        });
      },
    ],function(err, res){
      var images = [];
      if(res[0])
      {
        res[0].map(function(image) {
          if(image.image_url)
          {
            var imageData = {image:image.image_url}
            images.push(imageData);
          }
          if(image.video_url)
          {
            var imageData = {video:image.video_url}
            images.push(imageData);
          }
        });
      }
      if(res[1])
      {
        res[1].map(function(image) {
          if(image.image_url)
          {
            var imageData = {image:image.image_url}
            images.push(imageData);
          }
          if(image.video_url)
          {
            var imageData = {video:image.video_url}
            images.push(imageData);
          }
        });
      }
      if(res[2])
      {
        res[2].map(function(image) {
          if(image.image_url)
          {
            var imageData = {image:image.image_url}
            images.push(imageData);
          }
          if(image.video_url)
          {
            var imageData = {video:image.video_url}
            images.push(imageData);
          }
        });
      }
      callback(err, images);
    });
  };


  product_reviews.productReviewAndRating = function(productId, userId, offset = 0, limit = 10, callback) {
    if (productId) {
      async.parallel(
        [
          function(cbk)
          {
            product_reviews.find({"where":{"product_id":productId},"include":
              [
                {"relation":"comments"},
                {"relation":"userDetail","scope": {"include":[{"relation":"reviews","scope":{"fields":["id"]}}],"fields":["first_name","last_name","image_url","facebook_id","username","total_review","total_media","total_following","total_follower"]}},
                {"relation":"likes","scope": {"fields":["id","user_id"]}},
                {"relation":"reply","scope": {"fields":["id","image_url","video_url"]}},
                {"relation":"productDetail","scope": {"fields":["primary_image_url"]}},
              ],'order' : 'comment_count DESC', 'offset' : offset, 'limit' : limit
              },function (err, review) {
              //console.log(review)
              cbk(null,review);
            });
          },
          function(cbk)
          {
            var condition = {};
            condition['product_id'] = ObjectId(productId);
            var reviewCollection = product_reviews.getDataSource().connector.collection(product_reviews.modelName);
            reviewCollection.aggregate(
              [
                {
                  $match : condition,
                },
                { 
                  $group: {
                    _id: { _id: "$product_id" },
                    total: { $sum: 1 },
                    avgRating: { $avg: "$rating"},
                    rating_1 : {$sum : {$cond: [{"$eq": [ "$rating", 1]},1,0]}},
                    rating_2 : {$sum : {$cond: [{"$eq": [ "$rating", 2]},1,0]}},
                    rating_3 : {$sum : {$cond: [{"$eq": [ "$rating", 3]},1,0]}},
                    rating_4 : {$sum : {$cond: [{"$eq": [ "$rating", 4]},1,0]}},
                    rating_5 : {$sum : {$cond: [{"$eq": [ "$rating", 5]},1,0]}},
                  }
                },
                {
                  $project: {
                    total: 1,
                    avgRating: 1,
                    rating_1: 1,
                    rating_2: 1,
                    rating_3: 1,
                    rating_4: 1,
                    rating_5: 1,
                    per_rating_1: { $multiply: [{$divide: [ "$rating_1", "$total" ]} ,100]},
                    per_rating_2: { $multiply: [ { $divide: [ "$rating_2", "$total" ]} ,100]},
                    per_rating_3: { $multiply: [ { $divide: [ "$rating_3", "$total" ]} ,100]},
                    per_rating_4: { $multiply: [ { $divide: [ "$rating_4", "$total" ]} ,100]},
                    per_rating_5: { $multiply: [ { $divide: [ "$rating_5", "$total" ]} ,100]},
                  }
                }
              ]
            ).toArray(function(err, docs) {
              //console.log(docs);
              if(err) {
                cbk(null,err);
              } else {
                cbk(null,docs);
              }
            });
          }
        ],function(err,res)
        {
          var images = [];
          var aggregateData = '';
          if(userId && res[0])
          {
            res[0].map(function(list, key) {
              var data = list.toJSON();
              if(data.likes && data.likes.length > 0)
              {
                data.likes.map(function(like_list) {
                  if(like_list['user_id'] == userId)
                  {
                    res[0][key]['liked'] = true;
                  }
                  else
                  {
                    res[0][key]['liked'] = false;
                  }
                });
              }
              if(data.productDetail && data.productDetail.primary_image_url)
              {
                var imageData = {image:data.productDetail.primary_image_url}
                images.push(imageData);
              }
              if(data.image_url && data.image_url != '')
              {
                var imageData = {image:data.image_url}
                images.push(imageData);
              }
              if(data.video_url && data.video_url != '')
              {
                var imageData = {video:data.video_url}
                images.push(imageData);
              }

              if(data.comments)
              {
                data.comments.map(function(comment_list) {
                  if(comment_list.image_url  && comment_list.image_url != '')
                  {
                    var imageData = {image:comment_list.image_url}
                    images.push(imageData);
                  }
                  if(comment_list.video_url  && comment_list.video_url != '')
                  {
                    var imageData = {video:comment_list.video_url}
                    images.push(imageData);
                  }
                });

              }

              if(data.reply)
              {
                data.reply.map(function(reply_list) {
                  if(reply_list.image_url && reply_list.image_url != '')
                  {
                    var imageData = {image:reply_list.image_url}
                    images.push(imageData);
                  }
                  if(reply_list.video_url && reply_list.video_url != '')
                  {
                    var imageData = {video:reply_list.video_url}
                    images.push(imageData);
                  }
                });
              }
              res[0][key]['media'] = images;
            })
          }
          if(res[1])
          {
            aggregateData = res[1][0];
          }
          var result = {
            reviews: res[0],
            aggregateData: aggregateData,
          };
          callback(null,result);
        }
      );
    }
    else{
      callback(null,null);
    }
  }

  product_reviews.userReviews = function(userId, offset = 0, limit = 10, callback) {
    if (userId) {
      async.parallel(
        [
          function(cbk)
          {
            product_reviews.find({"where":{"user_id":userId},
              "include":[
                {"relation":"comments"},
                {"relation":"productDetail","scope":{"fields":["name","primary_image_url","brand_name"]}},
                {"relation":"userDetail","scope":{"fields":["first_name","last_name","image_url","facebook_id","total_media","username","total_review","total_media","total_following","total_follower"]}},
                {"relation":"likes"}
              ], "order":"id desc", "offset":offset, "limit":limit
            },function (err, review) {
              //console.log(review)
              cbk(null,review);
            });
          },
          
        ],function(err,res)
        {
          //console.log(res);
          async.parallel([
            function(cbk2)
            {
              cbk2(null,res[0]);
            },
            function(cbk2)
            {
            
              if(res && res[0] && res[0].length)
              {
                var aggData = [];
                res[0].map(function(list, key) {
                  var condition = {};
                  condition['product_id'] = ObjectId(list.product_id);
                  var reviewCollection = product_reviews.getDataSource().connector.collection(product_reviews.modelName);
                  reviewCollection.aggregate(
                    [
                      {
                        $match : condition,
                      },
                      { 
                        $group: {
                          _id: { _id: "$product_id" },
                          total: { $sum: 1 },
                          avgRating: { $avg: "$rating"},
                        }
                      },
                      {
                        $project: {
                          total: 1,
                          avgRating:1,
                        }
                      }
                    ]
                  ).toArray(function(err, docs) {
                    aggData.push(docs[0]);
                    if(res[0].length == (key+1))
                    {
                      cbk2(null,aggData);
                    }
                  });
                });
              }
              else{
                cbk2(null,null);
              }
            },
            ],function(err,res)
          { 
            
            var result = [];
            if(res && res[0] && res[0].length && res[1] )
            {
              res[0].map(function(list, key) {
                //console.log(list);
                var images = [];
                var data = list.toJSON();
                if(data.likes && data.likes.length > 0)
                {
                  data.likes.map(function(like_list) {
                    if(like_list['user_id'] == userId)
                    {
                      res[0][key]['liked'] = true;
                    }
                    else
                    {
                      res[0][key]['liked'] = false;
                    }
                  });
                }
                if(data.productDetail && data.productDetail.primary_image_url)
                {
                  var imageData = {image:data.productDetail.primary_image_url}
                  images.push(imageData);
                }
                if(data.image_url && data.image_url != '')
                {
                  var imageData = {image:data.image_url}
                  images.push(imageData);
                }
                if(data.video_url && data.video_url != '')
                {
                  var imageData = {video:data.video_url}
                  images.push(imageData);
                }

                if(data.comments)
                {
                  data.comments.map(function(comment_list) {
                    if(comment_list.image_url  && comment_list.image_url != '')
                    {
                      var imageData = {image:comment_list.image_url}
                      images.push(imageData);
                    }
                    if(comment_list.video_url  && comment_list.video_url != '')
                    {
                      var imageData = {video:comment_list.video_url}
                      images.push(imageData);
                    }
                  });

                }

                if(data.reply)
                {
                  data.reply.map(function(reply_list) {
                    if(reply_list.image_url && reply_list.image_url != '')
                    {
                      var imageData = {image:reply_list.image_url}
                      images.push(imageData);
                    }
                    if(reply_list.video_url && reply_list.video_url != '')
                    {
                      var imageData = {video:reply_list.video_url}
                      images.push(imageData);
                    }
                  });
                }
                //console.log(images);
                list['media'] = images;
                //res[0][key]['media'] = images;
                result[key] = {
                      reviews : list,
                      aggrigateData : res[1][key]
                    }
              })
              // res[0].map(function(list, key) {
              //   result[key] = {
              //     reviews : list,
              //     aggrigateData : res[1][key]
              //   }
              // });
              callback(null,result);
            }
            else
            {
              callback(null,null  );
            }
          });
        });
      
    }
    else{
      callback(null,null);
    }
  }

  product_reviews.userReviewsCount = function(userId, callback) {
    product_reviews.count({"user_id":userId},function (err, review) {
      callback(null,review);
    });
  }

  product_reviews.getReviewComments = function(reviewId, userId, callback) {
    if (reviewId) {
     
      async.parallel(
        [
          function(cbk)
          {
            product_reviews.find({"where":{"id":reviewId},"include":
            [
              {
                "relation":"comments","scope":{
                  "include":[{"relation":"userDetail","scope":{
                    "include":[{"relation":"reviews","scope":{"fields":["id"]}}], 
                    "fields":["first_name","last_name","image_url","facebook_id","username","total_review","total_media","total_following","total_follower"]}},
                    {"relation":"likes","scope":{"fields":["id","user_id"]}},
                    {"relation":"reply","scope":{"include":[{"relation":"userDetail","scope":{"include":[{"relation":"reviews","scope":{"fields":["id"]}}],
                    "fields":["first_name","last_name","image_url","facebook_id","username","total_review","total_media","total_following","total_follower"]}}]}}
                  ]
                },
                "fields":["first_name","last_name","image_url","facebook_id","username","total_review","total_media","total_following","total_follower"]
              },
              {"relation":"productDetail","scope":{"fields":["name","primary_image_url","brand_name"]}},
              {"relation":"userDetail","scope":{"include":[{"relation":"reviews","scope":{"fields":["id"]}}],"fields":["first_name","last_name","image_url","facebook_id","username","total_review","total_media","total_following","total_follower"]}},
              {"relation":"likes","scope":{"include":[{"relation":"userDetail","scope":{"include":[{"relation":"reviews","scope":{"fields":["id"]}}],"fields":["first_name","last_name","image_url","facebook_id","username","total_review","total_media","total_following","total_follower"]}}]},"scope":{"fields":["id","user_id"]}},
              {"relation":"reply","scope": {"fields":["id","image_url","video_url"]}},
            ],
            "counts":"comments"
            },function (err, review) {
              if(review)
              {
                cbk(null,review[0]);
              }
              else{
                cbk(null,err);
              }
              
            });
          },
        ],function(err,res)
        {
          var images = [];
          if(userId && res[0])
          {
            var data = res[0].toJSON();
            data.comments.map(function(list, key) {
              if(list.likes && list.likes.length > 0)
              {
                list.likes.map(function(like_list) {
                  if(like_list['user_id'] == userId)
                  {
                    data['comments'][key] = {
                      "liked" : true,
                      "comment" : data['comments'][key]['comment'],
                      "created" : data['comments'][key]['created'],
                      "user_id" : data['comments'][key]['user_id'],
                      "review_id" : data['comments'][key]['review_id'],
                      "userDetail" : data['comments'][key]['userDetail'],
                      "reply" : data['comments'][key]['reply'],
                      "likes" : data['comments'][key]['likes'],
                    };
                  }
                });
              }
            });

            data.likes.map(function(like_list) {
              if(like_list['user_id'] == userId)
              {
                data['liked'] = true;
              }
            });

            if(data.productDetail && data.productDetail.primary_image_url)
              {
                var imageData = {image:data.productDetail.primary_image_url}
                images.push(imageData);
              }
              if(data.image_url)
              {
                var imageData = {image:data.image_url}
                images.push(imageData);
              }
              if(data.video_url)
              {
                var imageData = {video:data.video_url}
                images.push(imageData);
              }

              if(data.comments)
              {
                data.comments.map(function(comment_list) {
                  if(comment_list.image_url)
                  {
                    var imageData = {image:comment_list.image_url}
                    images.push(imageData);
                  }
                  if(comment_list.video_url)
                  {
                    var imageData = {video:comment_list.video_url}
                    images.push(imageData);
                  }
                });

              }

              if(data.reply)
              {
                data.reply.map(function(reply_list) {
                  if(reply_list.image_url)
                  {
                    var imageData = {image:reply_list.image_url}
                    images.push(imageData);
                  }
                  if(reply_list.video_url)
                  {
                    var imageData = {video:reply_list.video_url}
                    images.push(imageData);
                  }
                });
              }

              data['media'] = images;
          }
          if(data)
          {
            callback(null,data);
          }
          else
          {
            callback(null,false);
          }
        }
      );
    }
    else{
      callback(null,null);
    }
  }

  product_reviews.afterRemote('create', function(context, data, next) {
    var total_media = 0;
    var total_review = 1;
    var Useractivities = product_reviews.app.models.user_activities;
    var products = product_reviews.app.models.products;
    var obj = {'user_id': data.user_id, 'review_id': data.id, 'product_id': data.product_id, 'type':'review', 'activity': 'add'};
    Useractivities.addActivity(obj, function(err, res) {
      if (err) {
        next(err);
      } else {
        var obj = {};
        var condition = {};
        condition['product_id'] = ObjectId(data.product_id);
        var reviewCollection = product_reviews.getDataSource().connector.collection(product_reviews.modelName);
        reviewCollection.aggregate(
          [
            {
              $match : condition,
            },
            { 
              $group: {
                _id: { _id: "$product_id" },
                total: { $sum: 1 },
                avgRating: { $avg: "$rating"},
                rating_1 : {$sum : {$cond: [{"$eq": [ "$rating", 1]},1,0]}},
                rating_2 : {$sum : {$cond: [{"$eq": [ "$rating", 2]},1,0]}},
                rating_3 : {$sum : {$cond: [{"$eq": [ "$rating", 3]},1,0]}},
                rating_4 : {$sum : {$cond: [{"$eq": [ "$rating", 4]},1,0]}},
                rating_5 : {$sum : {$cond: [{"$eq": [ "$rating", 5]},1,0]}},
              }
            },
            {
              $project: { total: 1, avgRating:1, rating_1: 1, rating_2: 1, rating_3: 1, rating_4: 1, rating_5: 1}
            }
          ]
        ).toArray(function(err, docs) {
          if (docs) {
            obj.overall_rating = docs[0].avgRating;
            obj.total_reviews = docs[0].total;
            obj.negative_rating =  docs[0].rating_1 + docs[0].rating_2;
            obj.nutrueal_rating =  docs[0].rating_3;
            obj.positive_rating =  docs[0].rating_4 + docs[0].rating_5;
            products.update({"id":data.product_id}, obj);
          }
        });
        
        if(data.image_url || data.video_url)
        {
          if(data.image_url) {
            total_media += 1;
          }
          if(data.video_url) {
            total_media += 1;
          }
          
          var Users = product_reviews.app.models.Users;
          Users.find({"where":{"id":data.user_id}},function(err, userData){
            if(userData)
            {
              if(userData[0]['total_review']) {
                total_review = userData[0]['total_review'] + 1;
              }
              if(userData[0]['total_media']) {
                var obj = { total_media: userData[0]['total_media'] + total_media, total_review: total_review};
              } else {
                var obj = { total_media: total_media, total_review: total_review};
              }
              Users.update({"id":data.user_id}, obj, function(err,userData){
                if(userData)
                {
                  var review_media = product_reviews.app.models.review_media;
                  products.findOne({"where":{"id" : data.product_id},"fields":["large_image_url"]}, function(err, productData){
                    if(err) {
                      next(err);
                    } else {
                      review_media.count({"product_id" : data.product_id, "review_id": ""}, function(err, mediaData){
                        if(err) {
                          next(err);
                        } else {
                          if(mediaData) {
                            var mediaData = {
                              'review_id': data.id, 
                              'user_id': data.user_id, 
                              'type': data.image_url ? 'image' : 'video', 
                              'product_id': data.product_id,
                              'media': data.image_url ? data.image_url : data.video_url, 
                              'aws_response': data.aws_image_response ? data.aws_image_response : data.aws_video_response
                            };
                            review_media.create(mediaData, function(err, mrdiaData){
                              if(err) {
                                next(err);
                              } else {
                                next();
                              }
                            });
                          } else {
                            //next();
                            var mediaData = {
                              'user_id': data.user_id, 
                              'type': 'image', 
                              'product_id': data.product_id,
                              'media': productData.large_image_url, 
                            };
                            review_media.create(mediaData, function(err, productMediaData){
                              if(err) {
                                next(err);
                              } else {
                                //next();
                                var mediaData = {
                                  'review_id': data.id, 
                                  'user_id': data.user_id, 
                                  'type': data.image_url ? 'image' : 'video', 
                                  'product_id': data.product_id,
                                  'media': data.image_url ? data.image_url : data.video_url, 
                                  'aws_response': data.aws_image_response ? data.aws_image_response : data.aws_video_response
                                };
                                review_media.create(mediaData, function(err, mrdiaData){
                                  if(err) {
                                    next(err);
                                  } else {
                                    next();
                                  }
                                });
                              }
                            });
                          }
                        }
                      });
                    }
                  });
                } else{
                  next(err);
                }
              })
            } else {
              next(err);
            }
          });
        } else {
          next();
        }
      }
    });
  });
};
