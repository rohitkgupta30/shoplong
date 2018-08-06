'use strict';
var async = require('async');


module.exports = function(Follow) {
  Follow.remoteMethod('addFollower', {
    http: {path: '/addFollower', verb: 'get'},
    accepts: [
      {arg: 'follower_user_id', type: 'string', http: {source: 'query'}, required: true, description: 'follower_user_id is required.'},
      {arg: 'following_user_id', type: 'string', http: {source: 'query'}, required: true, description: 'following_user_id is required.'},
    ],
    returns: {arg: 'result', type: 'object', root: true},
    description: 'add Follower',
  });

  Follow.remoteMethod('getFollower', {
    http: {path: '/getFollower', verb: 'get'},
    accepts: [
      {arg: 'user_id', type: 'string', http: {source: 'query'}, required: true, description: 'user_id is required.'},
      {arg: 'logged_user_id', type: 'string', http: {source: 'query'}, required: true, description: 'logged_user_id is required.'},
      {arg: 'offset', type: 'string', http: {source: 'query'}, description: 'offset for pagination.'},
      {arg: 'limit', type: 'string', http: {source: 'query'}, description: 'limit of pagiantion.'},
    ],
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Get all Follower',
  });

  Follow.remoteMethod('getFollowerCount', {
    http: {path: '/getFollowerCount', verb: 'get'},
    accepts: [
      {arg: 'user_id', type: 'string', http: {source: 'query'}, required: true, description: 'user_id is required.'},
    ],
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Get all Follower',
  });

  Follow.remoteMethod('crossFollow', {
    http: {path: '/crossFollow', verb: 'get'},
    accepts: [
      {arg: 'id', type: 'string', http: {source: 'query'}, required: true, description: 'id is required.'},
    ],
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Get all crossFollow',
  });

  Follow.remoteMethod('unFollow', {
    http: {path: '/unFollow', verb: 'get'},
    accepts: [
      {arg: 'id', type: 'string', http: {source: 'query'}, required: true, description: 'id is required.'},
      {arg: 'user_id', type: 'string', http: {source: 'query'}, required: true, description: 'UnFollower id is required.'},
    ],
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Get all unFollow',
  });


  Follow.remoteMethod('getFollowing', {
    http: {path: '/getFollowing', verb: 'get'},
    accepts: [
      {arg: 'user_id', type: 'string', http: {source: 'query'}, required: true, description: 'user_id is required.'},
      {arg: 'logged_user_id', type: 'string', http: {source: 'query'}, required: true, description: 'logged_user_id is required.'},
      {arg: 'offset', type: 'string', http: {source: 'query'}, description: 'offset for pagination.'},
      {arg: 'limit', type: 'string', http: {source: 'query'}, description: 'limit of pagiantion.'},
    ],
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Get all Following',
  });

  Follow.remoteMethod('getFollowingCount', {
    http: {path: '/getFollowingCount', verb: 'get'},
    accepts: [
      {arg: 'user_id', type: 'string', http: {source: 'query'}, required: true, description: 'user_id is required.'},
    ],
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Get all Following',
  });

  Follow.addFollower = function(followerUserId, followingUserId, cb) {
    if (followerUserId && followingUserId) {
      // check already added
      Follow.findOne({'where': {
        'or': [
          {'and': [{'follower_user_id': followerUserId}, {'following_user_id': followingUserId}]}, 
          {'and': [{'follower_user_id': followingUserId}, {'following_user_id': followerUserId}]}
        ]}}, function(err, user) {
        if (err) {
          cb(null, err);
        } else if (user){
          if (user['follower_user_id'].toString() === followingUserId.toString()) {
            var obj = (user['follower_status'] === 1) ? {'follower_status': 0} : {'follower_status': 1};
          } else {
            var obj = (user['following_status'] === 1) ? {'following_status': 0} : {'following_status': 1};
          }
          Follow.updateAll({"id": user.id}, obj, function(err, data) {
            if (data) {
              updateFollowerCount(user.follower_user_id, function(err, result) {
                if (err) {
                  cb(null, err);
                } else {
                  updateFollowingCount(user.following_user_id, function(err, result) {
                    if (err) {
                      cb(null, err);
                    } else {
                      cb(null, true);
                    }
                  });
                }
              });
            } else {
              cb(null, null);
            }
          });
        } else {
          var newObj = {
            "follower_user_id": followerUserId,
            "follower_status": 0,
            "following_user_id": followingUserId,
            "following_status": 1,
          };
          Follow.create(newObj, function(err, data) {
            if (data) {
              updateFollowerCount(followerUserId, function(err, result) {
                if (err) {
                  cb(null, err);
                } else {
                  updateFollowingCount(followingUserId, function(err, result) {
                    if (err) {
                      cb(null, err);
                    } else {
                      cb(null, true);
                    }
                  });
                }
              });
            } else {
              cb(null, null);
            }
          });
        }
      });
    } else {
      var error = new Error();
      error.message = 'Missing required fields (follower_user_id, following_user_id)';
      error.statusCode = 425;
      cb(error);
    }
  };

  Follow.getFollower = function(userId, logged_user_id, offset, limit, callback) {
    if (userId && logged_user_id) {
      async.parallel([
        function (cbk) { 
          var newObj = {"where": {"follower_user_id": userId},'include':[{"relation":"followingDetail"}], "offset":offset, "limit":limit, "order" : "id desc"};
          Follow.find(newObj, function(err, data) {
            if (err) {
              cbk(err);
            } else {
              cbk(null, data);
            }
          });
        },
        function (cbk) { 
          var newObj = {"where": { "or":[{"following_user_id": logged_user_id},{"follower_user_id": logged_user_id}]}};
          Follow.find(newObj, function(err, favList){
            if(favList && favList.length)
            {
              var plist = [];
              favList.forEach(function(list, key) {
                if(list['following_user_id'].toString() == logged_user_id.toString() && list['following_status'] == 1)
                {
                  plist.push(list['follower_user_id'].toString());
                }
                else if(list['follower_user_id'].toString() == logged_user_id.toString() && list['follower_status'] == 1)
                {
                  plist.push(list['following_user_id'].toString());
                }
                if(key == favList.length-1)
                {
                  cbk(null, plist);
                }
              });
            }
            else
            {
              cbk(null, err);
            }
          })
        }
      ],function(err, res)
      { 
        if(res && res[0].length)
        {
          if(res[1])
          {
            res[0].forEach(function(list, key) {
              if(res[1].indexOf(list['follower_user_id'].toString()) > -1 )
              {
                res[0][key]['already_follow'] = true;
              }
              else
              {
                res[0][key]['already_follow'] = false;
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
      })
    } else {
      var error = new Error();
      error.message = 'Missing required fields (userId,)';
      error.statusCode = 425;
      callback(error);
    }
  };

  Follow.getFollowerCount = function(userId, cb) {
    if (userId) {
      var newObj = {"follower_user_id": userId};
      Follow.count(newObj, function(err, data) {
        if (err) {
          cb(err);
        } else {
          cb(null, data);
        }
      });
    } else {
      var error = new Error();
      error.message = 'Missing required fields (userId,)';
      error.statusCode = 425;
      cb(error);
    }
  };

  Follow.getFollowing = function(userId, logged_user_id, offset, limit, callback) {
    if (userId && logged_user_id) {
      async.parallel([
        function (cbk) { 
          var newObj = {"where": {"following_user_id": userId},'include':[{"relation":"followerDetail"}], "offset":offset, "limit":limit, "order" : "id desc"};
          Follow.find(newObj, function(err, data) {
            if (err) {
              cbk(err);
            } else {
              cbk(null, data);
            }
          });
        },
        function (cbk) { 
          var newObj = {"where": { "or":[{"following_user_id": logged_user_id},{"follower_user_id": logged_user_id}]}};
          Follow.find(newObj, function(err, favList){
            if(favList && favList.length)
            {
              var plist = [];
              favList.forEach(function(list, key) {
                if(list['following_user_id'].toString() == logged_user_id.toString() && list['following_status'] == 1)
                {
                  plist.push(list['follower_user_id'].toString());
                }
                else if(list['follower_user_id'].toString() == logged_user_id.toString() && list['follower_status'] == 1)
                {
                  plist.push(list['following_user_id'].toString());
                }
                if(key == favList.length-1)
                {
                  cbk(null, plist);
                }
              });
            }
            else
            {
              cbk(null, err);
            }
          })
        }
      ],function(err, res)
      { 
        console.log(res);
        if (res && res[0].length) {
          if (res[1]) {
            res[0].forEach(function(list, key) {
              if (res[1].indexOf(list['following_user_id'].toString()) > -1) {
                res[0][key]['already_follow'] = true;
              } else {
                res[0][key]['already_follow'] = false;
              }

              if (key === res[0].length - 1) {
                callback(null, res[0]);
              }
            });
          } else {
            callback(null, res[0]);
          }
        } else {
          callback(null, null);
        }
      });
    } else {
      var error = new Error();
      error.message = 'Missing required fields (userId,)';
      error.statusCode = 425;
      callback(error);
    }
  };

  Follow.getFollowingCount = function(userId, cb) {
    if (userId) {
      var newObj = {"following_user_id": userId};
      Follow.count(newObj, function(err, data) {
        if (err) {
          cb(err);
        } else {
          cb(null, data);
        }
      });
    } else {
      var error = new Error();
      error.message = 'Missing required fields (userId,)';
      error.statusCode = 425;
      cb(error);
    }
  };

  Follow.crossFollow = function(id, cb) {
    console.log(id);
    var obj = {'follower_status':1};
    Follow.updateAll({"id":id}, obj,function(err, data){
      if (data) {
        updateFollowerCount(data.follower_user_id, function(err, result) {
          if (err) {
            cb(null, err);
          } else {
            updateFollowingCount(data.follower_user_id, function(err, result) {
              if (err) {
                cb(null, err);
              } else {
                cb(null, true);
              }
            });
          }
        });
      } else {
        cb(null, null);
      }
    });
  }

  Follow.unFollow = function(connectedId, userId, cb) {
    Follow.findOne({'where': {
      'or': [
        {'and': [{'follower_user_id': connectedId}, {'following_user_id': userId}]}, 
        {'and': [{'follower_user_id': userId}, {'following_user_id': connectedId}]}
      ]}}, function(err, follow) {
      if (err) {
        cb(null, err);
      } else {
        if (follow['follower_user_id'].toString() === userId.toString()) {
          var obj = {'follower_status': 0};
        } else {
          var obj = {'following_status': 0};
        }
        Follow.updateAll({"id": follow.id }, obj, function(err, data) {
          if (data) {
            updateFollowerCount(data.follower_user_id, function(err, result) {
              if (err) {
                cb(null, err);
              } else {
                updateFollowingCount(data.follower_user_id, function(err, result) {
                  if (err) {
                    cb(null, err);
                  } else {
                    cb(null, true);
                  }
                });
              }
            });
          } else {
            cb(null, null);
          }
        });
      }
    });
  }

  function updateFollowerCount(userId, callback)
  {
    var Users = Follow.app.models.Users;
    console.log('updateFollowerCount');
    console.log({"follower_user_id": userId, 'follower_user_status': 1 });
    Follow.count({"follower_user_id": userId, 'follower_user_status': 1 }, function(err, userData) {
      console.log(userData);
      if(err) {
        callback(null, err);
      } else {
        var obj = {total_follower: userData};
        Users.updateAll({ "id": userId}, obj, function(err, userData) {
          if(err) {
            callback(null, err);
          } else {
            callback(null, userData);
          }
        });
      }
    });
  }

  function updateFollowingCount(userId, callback)
  {
    var Users = Follow.app.models.Users;
    console.log('updateFollowingCount');
    console.log({"following_user_id": userId, 'following_user_status': 1 });
    Follow.count({"following_user_id": userId, 'following_user_status': 1 }, function(err, userData) {
      if (err) {
        callback(null, err);
      } else {
        var obj = {total_following: userData};
        Users.updateAll({ "id": userId}, obj, function(err, userData) {
          if(err) {
            callback(null, err);
          } else {
            callback(null, userData);
          }
        });
      }
    });
  }
}


