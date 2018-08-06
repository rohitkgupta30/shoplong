'use strict';

module.exports = function(Reviewlikes) {
  Reviewlikes.remoteMethod('addReviewLike', {
    http: {path: '/addReviewLike', verb: 'get'},
    accepts: [
      {arg: 'userId', type: 'string', http: {source: 'query'}, required: true, description: 'User id is required.'},
      {arg: 'reviewId', type: 'string', http: {source: 'query'}, required: true, description: 'Review id is required.'},
      {arg: 'productId', type: 'string', http: {source: 'query'}, required: true, description: 'Product id is required.'},
    ],
    returns: {arg: 'result', type: 'string'},
    description: 'Add review like.',
  });


  Reviewlikes.remoteMethod('removewReviewLike', {
    http: {path: '/removewReviewLike', verb: 'get'},
    accepts: [
      {arg: 'userId', type: 'string', http: {source: 'query'}, required: true, description: 'User id is required.'},
      {arg: 'reviewId', type: 'string', http: {source: 'query'}, required: true, description: 'Review id is required.'},
      {arg: 'productId', type: 'string', http: {source: 'query'}, required: true, description: 'Product id is required.'},
    ],
    returns: {arg: 'result', type: 'string'},
    description: 'Remove review like.',
  });

  Reviewlikes.addReviewLike = function(userId, reviewId, productId, cb) {
    if(userId && reviewId)
    {
      var newObj = {
        "user_id": userId,
        "product_id": productId,
        "review_id": reviewId,
      };
      Reviewlikes.create(newObj, function(err, data) {
        if (err) {
          cb(err);
        } else {
          cb(null, data);
        }
      })
    }
    else{
        var error = new Error();
        error.message = 'Missing required fields (userId, reviewId)';
        error.statusCode = 425;
        cb(error);
    }
  }

  Reviewlikes.removewReviewLike = function(userId, reviewId, productId, cb) {
    if (userId && reviewId) {
      var newObj = {
        "user_id": userId,
        "product_id": productId,
        "review_id": reviewId
      };
      Reviewlikes.destroyAll(newObj, function(err,data) {
        if(err) {
          cb(err);
        } else {
          cb(null, true);
        }
      });
    } else {
        var error = new Error();
        error.message = 'Missing required fields (userId, reviewId)';
        error.statusCode = 425;
        cb(error);
    }
  }

  Reviewlikes.afterRemote('addReviewLike', function(context, data, next) {
    var obj = {'user_id': data.result.user_id, 'product_id': data.result.product_id, 'review_id': data.result.review_id, 'type': 'review', 'activity': 'like'};
    addActivity(obj, function(err, resp) {
      if (err) {
        next(err);
      } else {
        var product_reviews = Reviewlikes.app.models.product_reviews;
        product_reviews.findOne({'where': {'id': data.review_id}, 'fields': ['like_count']}, function(err, res) {
          var obj = {'like_count': res.like_count + 1};
          product_reviews.update({'id': data.review_id}, obj, function(err, res) {
            if(err) {
              next(err);
            } else {
              next();
            }
          });
        });
      }
    });
  });

  function addActivity(obj, callback) {
    var Useractivities = Reviewlikes.app.models.user_activities;
    Useractivities.addActivity(obj, function(err, res) {
      if (err) {
        callback(null, err);
      } else {
        callback(null, res);
      }
    });
  }
};
