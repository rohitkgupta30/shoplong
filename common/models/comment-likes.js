'use strict';

module.exports = function(Commentlikes) {
  Commentlikes.remoteMethod('addCommentLike', {
    http: {path: '/addCommentLike', verb: 'get'},
    accepts: [
      {arg: 'userId', type: 'string', http: {source: 'query'}, required: true, description: 'User id is required.'},
      {arg: 'commentId', type: 'string', http: {source: 'query'}, required: true, description: 'Comment id is required.'},
      {arg: 'productId', type: 'string', http: {source: 'query'}, required: true, description: 'Product id is required.'},
    ],
    returns: {arg: 'result', type: 'string'},
    description: 'Add comment like.',
  });


  Commentlikes.remoteMethod('removeCommentLike', {
    http: {path: '/removeCommentLike', verb: 'get'},
    accepts: [
      {arg: 'userId', type: 'string', http: {source: 'query'}, required: true, description: 'User id is required.'},
      {arg: 'commentId', type: 'string', http: {source: 'query'}, required: true, description: 'Comment id is required.'},
      {arg: 'productId', type: 'string', http: {source: 'query'}, required: true, description: 'Product id is required.'},
    ],
    returns: {arg: 'result', type: 'string'},
    description: 'Remove comment like.',
  });

  Commentlikes.addCommentLike = function(userId, commentId, productId, cb) {
    if(userId && commentId)
    {
      var newObj = {
        "user_id": userId,
        "product_id": productId,
        "comment_id": commentId
      };
      Commentlikes.create(newObj, function(err, data) {
        if(err) {
          cb(err);
        } else {
          // var obj = {'user_id': userId, 'product_id': productId, 'comment_id': commentId, 'type': 'comment', 'activity': 'like'};
          // //console.log(obj);
          // addActivity(obj, function(err, resp) {
          //   //console.log(err);
          //   //console.log(resp);
          //   if (err) {
          //     cb(null, err);
          //   } else {
          //     cb(null, true);
          //   }
            
          // });
          cb(null, data);
        }
      });
    }
    else{
        var error = new Error();
        error.message = 'Missing required fields (userId, commentId)';
        error.statusCode = 425;
        cb(error);
    }
  }

  Commentlikes.removeCommentLike = function(userId, commentId, productId, cb) {
    if(userId && commentId)
    {
      var newObj = {
        "user_id": userId,
        "product_id": productId,
        "comment_id": commentId
      };
      Commentlikes.destroyAll(newObj, function(err,data) {
        if(err)
        {
            cb(err);
        }
        else
        {
          cb(null, true);
        }
      })
    }
    else{
        var error = new Error();
        error.message = 'Missing required fields (userId, commentId)';
        error.statusCode = 425;
        cb(error);
    }
  }

  Commentlikes.afterRemote('addCommentLike', function(context, data, next) {
    var obj = {'user_id': data.result.user_id, 'product_id': data.result.product_id, 'review_id': data.result.review_id, 'comment_id': data.result.comment_id, 'type': 'comment', 'activity': 'like'};
    addActivity(obj, function(err, resp) {
      if (err) {
        next(err);
      } else {
        var review_comments = Commentlikes.app.models.review_comments;
        review_comments.findOne({'where': {'id': data.comment_id}, 'fields': ['like_count']}, function(err, res) {
          var obj = {'like_count': res.like_count + 1};
          review_comments.update({'id': data.comment_id}, obj, function(err, res) {
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
    var Useractivities = Commentlikes.app.models.user_activities;
    Useractivities.addActivity(obj, function(err, res) {
      if (err) {
        callback(null, err);
      } else {
        callback(null, res);
      }
    });
  }
};
