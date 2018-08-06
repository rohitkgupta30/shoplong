'use strict';
var app = require('../../server/server');

module.exports = function(Reviewmedia) {
  Reviewmedia.afterRemote('create', function(context, data, next) {
    if (data.review_id) {
      var Useractivities = Reviewmedia.app.models.user_activities;
      var obj = {'user_id': data.user_id, 
        'media_id': data.id,
        'review_id': data.review_id ? data.review_id : '',
        'comment_id': data.comment_id ? data.comment_id : '',
        'product_id': data.product_id,
        'type': data.type,
        'activity': 'add',
      };
      Useractivities.addActivity(obj, function(err, res) {
        if (err) {
          next(err);
        } else {
          next();
        }
      });
    } else {
      next();
    }
  });
};
