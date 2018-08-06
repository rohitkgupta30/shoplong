'use strict';

module.exports = function(Reviewcommentreply) {
  Reviewcommentreply.afterRemote('create', function(context, data, next) {
    var Useractivities = Reviewcommentreply.app.models.user_activities;
    var obj = {'user_id': data.user_id, 
      'reply_id': data.id,
      'review_id': data.review_id ? data.review_id : '',
      'comment_id': data.comment_id ? data.comment_id : '',
      'product_id': data.product_id,
      'type': 'reply',
      'activity': 'add',
    };
    Useractivities.addActivity(obj, function(err, res) {
      if (err) {
        next(err);
      } else {
        var total_media = 0;
        if (data.image_url || data.video_url)
        {
          if(data.image_url)
          {
            total_media += 1;
          }
          if(data.video_url)
          {
            total_media += 1;
          }
          
          var Users = Reviewcommentreply.app.models.Users;
          Users.find({"where":{"id":data.user_id}},function(err, userData){
            if(userData)
            {
              if(userData[0]['total_media'])
              {
                var obj = { total_media: userData[0]['total_media'] + total_media};
              }
              else{
                var obj = { total_media: total_media};
              }
              Users.updateAll({"id":data.user_id}, obj,function(err,userData){
                if(userData)
                {
                  //next();
                  var mediaData = {
                    'review_id': data.review_id, 
                    'comment_id': data.review_comment_id, 
                    'reply_id': data.id, 
                    'user_id': data.user_id, 
                    'type': data.image_url ? 'image' : 'video', 
                    'product_id': data.product_id,
                    'media': data.image_url ? data.image_url : data.video_url, 
                    'aws_response': data.aws_image_response ? data.aws_image_response : data.aws_video_response
                  };
                  var review_media = Reviewcommentreply.app.models.review_media;
                  review_media.create(mediaData, function(err, mrdiaData){
                    if(err) {
                      next(err);
                    } else {
                      next();
                    }
                  });
                }
                else{
                  next(err);
                }
              })
            }
            else
            {
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
