let mongoose = require('mongoose');
let Schema = mongoose.Schema;


let exercise = new Schema ({
  username: String,
  count: Number,
  log : [{ 
    description: String, 
    duration: Number, 
    date: Date }]
})


//Create model
let user = mongoose.model("user", exercise)

//Export model
exports.user = user;