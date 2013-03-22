var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
  
  var UserSchema = new Schema({
    id : Number,
    name : String,
    username : String,
    email : String,
    birthday : String
});


module.exports = mongoose.model('UserModel', UserSchema);
