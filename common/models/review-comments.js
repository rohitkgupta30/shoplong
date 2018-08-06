'use strict';

module.exports = function(Reviewcomments) {
  Reviewcomments.afterRemote('create', function(context, data, next) {
    var Useractivities = Reviewcomments.app.models.user_activities;
    var userId = data.user_id;
    var itemId = data.id;
    var type = 'comment';
    var activity = 'add';
    Useractivities.addActivity({'user_id': userId, 'comment_id': itemId, 'review_id': data.review_id, 'product_id': data.product_id,  'type': type, 'activity': activity}, function(err, res) {
      if (err) {
        next(err);
      } else {
        if (data.review_id) {
          Reviewcomments.count({"review_id": data.review_id}, function(err, reviewCount) {
            if (reviewCount) {
              var product_reviews = Reviewcomments.app.models.product_reviews;
              var obj = {"comment_count": reviewCount};
              product_reviews.updateAll({'id': data.review_id}, obj);
            }
          });
        }
        if(data.image_url || data.video_url) {
          var total_media = 0;
          if(data.image_url) {
            total_media += 1;
          }
          if(data.video_url)
          {
            total_media += 1;
          }
          var Users = Reviewcomments.app.models.Users;
          Users.find({"where":{"id":data.user_id}},function(err, userData){
            if(userData)
            {
              if(userData[0]['total_media']) {
                var obj = { total_media: userData[0]['total_media'] + total_media};
              } else {
                var obj = { total_media: total_media};
              }
              Users.updateAll({"id":data.user_id}, obj,function(err,userData){
                if(userData)
                {
                  //next();
                  var mediaData = {
                    'review_id': data.review_id, 
                    'comment_id': data.id, 
                    'user_id': data.user_id, 
                    'type': data.image_url ? 'image' : 'video', 
                    'product_id': data.product_id,
                    'media': data.image_url ? data.image_url : data.video_url, 
                    'aws_response': data.aws_image_response ? data.aws_image_response : data.aws_video_response
                  };
                  var review_media = Reviewcomments.app.models.review_media;
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
        }
        else
        {
          next();
        }
      }
    });
  });
};
