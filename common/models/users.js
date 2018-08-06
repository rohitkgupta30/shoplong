'use strict';
var async = require('async');
var ObjectId = require('mongodb').ObjectID;

module.exports = function(Users) {
  Users.remoteMethod('facebookLogin', {
    accepts: [{arg: 'data', type: 'object', http: {source: 'body'}}],
    returns: {arg: 'trainers', type: {
      'facebook_id': 'string',
      'first_name': 'string',
      'last__name': 'string',
      'email': 'string',
    }, root: true},
    description: 'Facebook Login',
    http: {path: '/facebook-login', verb: 'post'},
  });

  Users.remoteMethod('getUserProfileDetail', {
    http: {path: '/getUserProfileDetail', verb: 'get'},
    accepts: [
      {arg: 'user_id', type: 'string', http: {source: 'query'}, required: true, description: 'User Id is required.'},
      {arg: 'loggedin_user_id', type: 'string', http: {source: 'query'}, description: 'Logged in User Id is required.'},
    ],
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Get user profile detail',
  });

  Users.getUserProfileDetail = function(userId, loggedInUserId = null, callback) {
    async.parallel([
      function(cb) {
        Users.findById(userId, function(err, user) {
          if (err) {
            cb(null, err);
          } else {
            if (loggedInUserId == userId) {
              user.self = true;
            }
            cb(null, user);
          }
        });
      },
      function(cb) {
        var follow = Users.app.models.follow;
        follow.findOne({'where': {'follower_user_id': userId, 'following_user_id': loggedInUserId}}, function(err, user) {
          if (err) {
            cb(null, err);
          } else {
            cb(null, user);
          }
        });
      },
      function(cb) {
        var condition = {};
        condition['user_id'] = ObjectId(userId);
        var col = Users.getDataSource().connector.collection('product_reviews');
          col.aggregate(
          [
            {
              $match : condition,
            },
            { 
              $group: {
                _id: { _id: "$user_id" },
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
            cb(null, docs);
          });
        //});
      },
      function(cb) {
        var product_reviews = Users.app.models.product_reviews;
        product_reviews.findOne({'where': {"user_id" : userId},"include":[
          {"relation":"comments"},
          {"relation":"userDetail","scope": {"fields":["first_name","last_name","image_url","facebook_id","username","total_review","total_media","total_following","total_follower"]}},
          {"relation":"likes","scope": {"fields":["id","user_id"]}},
          {"relation":"reply","scope": {"fields":["id","image_url","video_url"]}},
          {"relation":"productDetail"},
        ], "order"  : "id desc"}, function(err, review) {
          if (err) {
            cb(null, err);
          } else {
            var images = [];
            if(review && review !== '')
            {
              var data = review.toJSON();
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
                
                cb(null, data);
              }
              else{
                cb(null, null);
              }
          }
        });
      }
    ], function(err, res) {
      if (res[1]) {
        if (loggedInUserId.toString() == res[1]['following_user_id'].toString()) {
          res[0]['type'] = 'Following';
        } else {
          res[0]['type'] = 'Follow';
        }
      }
      var aggregateData = '';
      if(res[2])
      {
        aggregateData = res[2][0];
      }
      var result = {
        profileData: res[0],
        followDetail: res[1],
        aggregateData: aggregateData,
        lastestReview : res[3]
      };
      callback(null,result);
    });
  };
  
  Users.facebookLogin = function(data, cb) {
    //var conditions = {'email': data.email};
    var conditions = {'facebook_id': data.facebook_id};
    if (!data.facebook_id) {
      throw new Error('Facebook Id is missing');
    }

    Users.findOne({
      where: conditions,
    }, function(error, user) {
      if  (!user) {
          if (data.first_name && data.last_name) {
            var username = data.first_name + '-' + data.last_name;
            var name = data.first_name + ' ' + data.last_name;
          } else if (data.first_name) {
            var username = user.first_name;
            var name = data.first_name;
          }
        username = username.toLowerCase();
        if (username) {
          var query = {'username': username};
          Users.count(query, function(err, count) {
            if (count) {
              data.username = username + '-' + count;
            } else {
              data.username = username;
            }
            data.name = name;
            Users.create(data, function(err, userData) {
              if (err) {
                cb(null, false);
              } else {
                cb(null, userData);
              }
            });
          });
        }
      } else {
        var app = Users.app;
        if (user.image) {
          user.image = user.image;
        }
        user.createAccessToken(17171717117, function(err, accessToken) {
          user.token = accessToken.id;
          user.userExist = true;
          cb(null, user);
        });
      }
    });
  };
};
