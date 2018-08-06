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
      {arg: 'loggedInUserId', type: 'string', http: {source: 'query'}, required: true, description: 'loggedInUserId is required.'},
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
      {arg: 'loggedInUserId', type: 'string', http: {source: 'query'}, required: true, description: 'loggedInUserId is required.'},
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
      Follow.findOne({'where': {'follower_user_id': followerUserId, 'following_user_id': followingUserId}}, function(err, user) {
        if (err) {
          cb(null, err);
        } else if (user){
          var newObj = {'follower_user_id': followerUserId, 'following_user_id': followingUserId};
          Follow.destroyAll(newObj, function(err, data) {
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
          var newObj = {'follower_user_id': followerUserId, 'following_user_id': followingUserId};
          Follow.create(newObj, function(err, data) {
            if (data) {
              var obj = {'user_id': data.following_user_id, 'follower_id': data.follower_user_id, 'type': 'user', 'activity': 'follow'};
              addActivity(obj, function(err, resp) {
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

  Follow.getFollower = function(userId, loggedInUserId, offset, limit, callback) {
    if (userId && loggedInUserId) {
      async.parallel([
        function(cbk) {
          var newObj = {'where': {'follower_user_id': userId}, 'include': [{'relation': 'followingDetail'}], 'offset': offset, 'limit': limit, 'order': 'id desc'};
          Follow.find(newObj, function(err, data) {
            if (err) {
              cbk(err);
            } else {
              cbk(null, data);
            }
          });
        },
        function(cbk) {
          Follow.find({'where': {'following_user_id': loggedInUserId}}, function(err, favList) {
            if (favList && favList.length) {
              var plist = [];
              favList.forEach(function(list, key) {
                if (list['follower_user_id'].toString() == loggedInUserId.toString()) {
                  plist.push(list['following_user_id'].toString());
                }
                if (key == favList.length - 1) {
                  cbk(null, plist);
                }
              });
            } else {
              cbk(null, err);
            }
          });
        },
      ], function(err, res) {
        if (res && res[0].length) {
          if (res[1]) {
            res[0].forEach(function(list, key) {
              if (res[1].indexOf(list['follower_user_id'].toString()) > -1) {
                res[0][key]['already_follow'] = true;
              } else {
                res[0][key]['already_follow'] = false;
              }
              if (key == res[0].length - 1) {
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

  Follow.getFollowerCount = function(userId, cb) {
    if (userId) {
      var newObj = {'follower_user_id': userId};
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

  Follow.getFollowing = function(userId, loggedInUserId, offset, limit, callback) {
    if (userId && loggedInUserId) {
      async.parallel([
        function (cbk) { 
          var newObj = {'where': {'following_user_id': userId},'include':[{'relation':'followerDetail'}], 'offset':offset, 'limit':limit, 'order' : 'id desc'};
          Follow.find(newObj, function(err, data) {
            if (err) {
              cbk(err);
            } else {
              cbk(null, data);
            }
          });
        },
        function(cbk) {
          Follow.find({'where': {'following_user_id': loggedInUserId}}, function(err, favList){
            if (favList && favList.length) {
              var plist = [];
              favList.forEach(function(list, key) {
                plist.push(list['follower_user_id'].toString());
                if(key == favList.length-1)
                {
                  cbk(null, plist);
                }
              });
            } else {
              cbk(null, err);
            }
          });
        },
      ], function(err, res) {
        if (res && res[0].length) {
          if (res[1]) {
            res[0].forEach(function(list, key) {
              if (res[1].indexOf(list['follower_user_id'].toString()) > -1) {
                res[0][key]['already_follow'] = true;
              } else {
                res[0][key]['already_follow'] = false;
              }

              if (key === res[0].length - 1) {
                callback(null, res[0]);
              }
            });
          } else if (userId.toString() === loggedInUserId.toString()) {
            res[0].forEach(function(list, key) {
              res[0][key]['already_follow'] = true;
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
      var newObj = {'following_user_id': userId};
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

  

  function updateFollowerCount(userId, callback)
  {
    var Users = Follow.app.models.Users;
    console.log('updateFollowerCount');
    console.log({'follower_user_id': userId});
    Follow.count({'follower_user_id': userId }, function(err, userData) {
      console.log(userData);
      if(err) {
        callback(null, err);
      } else {
        var obj = {total_follower: userData};
        Users.updateAll({ 'id': userId}, obj, function(err, userData) {
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
    console.log({'following_user_id': userId});
    Follow.count({'following_user_id': userId}, function(err, userData) {
      if (err) {
        callback(null, err);
      } else {
        var obj = {total_following: userData};
        Users.updateAll({ 'id': userId}, obj, function(err, userData) {
          if(err) {
            callback(null, err);
          } else {
            callback(null, userData);
          }
        });
      }
    });
  }
  
  function addActivity(obj, callback) {
    var Useractivities = Follow.app.models.user_activities;
    Useractivities.addActivity(obj, function(err, res) {
      if (err) {
        callback(null, err);
      } else {
        callback(null, res);
      }
    });
  }
}



