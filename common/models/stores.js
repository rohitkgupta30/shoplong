'use strict';

module.exports = function(Stores) {
  var async = require('async');
  Stores.remoteMethod('storeSelectList', {
    http: {path: '/storeSelectList',verb: 'get'},
    returns: {rg: 'result', type: 'object', root: true},
    description: 'Get list of store for dropdown list',
  });

  Stores.remoteMethod('updateStoreIdInStoreLocation', {
    http: {path: '/updateStoreIdInStoreLocation', verb: 'get'},
    returns: {arg: 'result', type: 'object', root: true},
    description: 'Update ',
  });

  Stores.remoteMethod('nearby', {
    http: {path: '/nearby', verb: 'get'},
    accepts: [
      {arg: 'lon', type: 'string', http: {source: 'query'}, required: true, description: 'Longitude is required.'},
      {arg: 'lat', type: 'string', http: {source: 'query'}, description: 'Latitude is requird.'},
      {arg: 'offset', type: 'string', http: {source: 'query'}, description: 'Paging  offset.'},
      {arg: 'limit', type: 'string', http: {source: 'query'}, description: 'Paging  limit.'},
    ],
    returns: {arg: 'result', type: 'string'},
    description: 'Users near stores  list.',
  });

  Stores.storeSelectList = function(cb) {
    var filter = {
      'where': {
        'status': {
          'neq': false,
        },
      },
      'order': 'name asc',
    };
    Stores.find(filter, function(err, stores) {
      if (err) {
        cb(err);
      }
      if (stores) {
        var tempStores = [];
        tempStores[0] = {
          _id: '',
          name: 'Select Store',
        };
        var index = 0;
        stores.forEach(function(store, key) {
          tempStores[key + 1] = {
            _id: store._id,
            name: store.name,
          };
          index++;
        });
        cb(null, tempStores);
      } else {
        cb(err);
      }
    });
  };

  Stores.updateStoreIdInStoreLocation = function(cb) {
    async.parallel([
      function(cbk)
      {
        Stores.find(function(err, store) {
          if (err) {
              cbk(err);
          }
          else {
              cbk(null, store);
          }
        });
      }
    ],function(err,res)
    {
      var totalbrand = 0;
      res[0].forEach(function(store, key){
        var obj = {"store_id": store._id};
        var StoreLocations = Stores.app.models.StoreLocations;
        StoreLocations.updateAll({'id' :  store.id,},obj);
        totalbrand ++;
      });
      if(res[0].length === totalbrand){
          cb(null,true);   
      }
    });
  };

  Stores.nearby = function(lon, lat, offset, limit, callback) {
    console.log(lon);
    console.log(lat);
    var query = {
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lon, lat],
          },
          $maxDistance: 100000,
        }
      }
    };

    Stores.getDataSource().connector.connect(function(err, db) {
      var col = db.collection('stores');
      col.find(query).toArray(function(err, arr) {
        if (err) { 
          callback(null, err); 
        } else { 
          callback(null, arr);
        }
      });
    });
  };
};
