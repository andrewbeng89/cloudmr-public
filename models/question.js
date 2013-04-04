var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
  
  var QuestionSchema = new Schema({
    question_id : Number,
    title : String,
    question : String,
    hint : String,
    js_code : String,
    py_code : String,
    js_tests : String,
    py_tests : String,
    mapper_code : String,
    reduce_code : String,
    combine_code : String
});


module.exports = mongoose.model('QuestionModel', QuestionSchema);
