
var mongodb = require('./db');

function User(user) {
  this.name = user.name;
  this.password = user.password;
  this.email = user.email;
};

module.exports = User;

// Save user data
User.prototype.save = function(callback) {
  // data to save
  var user = {
      name: this.name,
      password: this.password,
      email: this.email
  };
  // open DB
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    // read user collections
    db.collection('users', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      // save user data into collections
      collection.insert(user, {
        safe: true
      }, function (err, user) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null, user[0]);//成功！err 为 null，并返回存储后的用户文档
      });
    });
  });
};

// read user data
User.get = function(name, callback) {
  // open db
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    // read collection
    db.collection('users', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      // find
      collection.findOne({
        name: name
      }, function (err, user) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null, user);
      });
    });
  });
};