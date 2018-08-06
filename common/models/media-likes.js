'use strict';

module.exports = function(MediaLikes) {
  MediaLikes.remoteMethod('deleteMediaLike', {
    http: {path: '/deleteMediaLike', verb: 'get'},
    accepts: [
      {arg: 'media_id', type: 'string', http: {source: 'query'}, required: true, description: 'media_id is required.'},
      {arg: 'user_id', type: 'string', http: {source: 'query'}, required: true, description: 'user_id is required.'},
      
    ],
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Get all deleteMediaLike product',
  });
  MediaLikes.deleteMediaLike = function(mediaId, userId, callback) {
    var newObj = {
      'media_id': mediaId,
      'user_id': userId,
    };
    MediaLikes.destroyAll(newObj, function(err, data) {
      if (err) {
        callback(null, err);
      } else {
        callback(null, newObj);
      }
    });
  };
  MediaLikes.afterRemote('create', function(context, data, next) {
    var reviewMedia = MediaLikes.app.models.review_media;
    var Useractivities = MediaLikes.app.models.user_activities;
    reviewMedia.findOne({ "where": {"id": data.media_id}}, function(err, res) {
      if(err) {
        next(err);
      } else { 
        var obj = {'user_id': data.user_id, 'media_id': data.media_id, 'review_id': res.review_id, 'product_id': res.product_id, 'comment_id': res.comment_id, 'reply_id': res.reply_id, 'type': res.type, 'activity': 'like'};
        Useractivities.addActivity(obj, function(err, res) {
          if(err) {
            next(err);
          } else {
            MediaLikes.count({'media_id': data.media_id}, function(err, userData) {
              if (err) {
                next(err);
              } else {
                var obj = {'total_likes': userData};
                reviewMedia.updateAll({'id': data.media_id}, obj, function(err, userData) {
                  if (err) {
                    next(err);
                  } else {
                    next();
                  }
                });
              }
            });
          }
        });
      }
    });
  });

  MediaLikes.afterRemote('deleteMediaLike', function(context, data, next) {
    var reviewMedia = MediaLikes.app.models.review_media;
    MediaLikes.count({'media_id': data.media_id}, function(err, userData){
      if (err) {
        next(err);
      } else {
        var obj = {'total_likes': userData};
        reviewMedia.updateAll({'id': data.media_id}, obj, function(err, userData) {
          if (err) {
            next(err);
          } else {
            next();
          }
        });
      }
    });
  });
};
