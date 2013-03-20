var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
  
  var QuestionSchema = new Schema({
    question_id : Number,
    hint : String,
    js_code : String,
    py_code : String
});


module.exports = mongoose.model('QuestionModel', QuestionSchema);
