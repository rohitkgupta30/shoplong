'use strict';

module.exports = function(app) {
  var User = app.models.admin;
  var Role = app.models.Role;
  var RoleMapping = app.models.RoleMapping;
  User.create([
    {username: 'Admin', email: 'admin@shoplong.com', password: '123456'},
  ], function(err, users) {
    if (users && users[0] && users[0].id) {
      // create the admin role
      Role.create({
        name: 'admin',
      }, function(err, role) {
        if (role) {
          // make bob an admin
          role.principals.create({
            principalType: RoleMapping.USER,
            principalId: users[0].id,
          }, function(err, principal) {
            if (err) console.log('err');
          });
        }
      });
    }
  });
};
