//reqs
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const mongoose = require('mongoose')


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true }, (error, client) => {
	console.log("Successfully connected to MongoDB");
})

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// let's make json a bit cleaner
app.set('json spaces', 2);

//Send the HTML
app.use(express.static('public'))
app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});


//Import model
let user = require('./schema.js').user

//  /api/exercise/new-user  code
app.post('/api/exercise/new-user', function(req, res, next) {
  let username = req.body.username;
  
  if(username) {//check if name is entered in field
    let userAdd = {username:username, count:0, log:[]};
    user.findOne({username: userAdd.username}, (err, data) =>{
      if (err) next(err);
      if (data) {
        res.send('Username is already taken.')
      } else {
      user.create(userAdd, (err,data) => {
        if(err) next(err);
        res.json({username: data.username, _id: data._id})
      })
      }
    })
  } else {
    res.send("Please provide a username")
  }
})


//  /api/exercise/add  code
app.post('/api/exercise/add', function(req, res, next) {
  let userId = req.body.userId;
  let description = req.body.description;
  let duration = req.body.duration;
  let date = req.body.date? new Date(req.body.date): new Date();
  

  let exerciseData;
  
  if(userId && description && duration) {
    user.findById(userId, function(err,data) {
      if(err) next(err);
      if(data) {
        
        data.count = data.count + 1;
        let additionExercise = {
          description : description,
          duration : duration,
          date : date.toDateString()
        };
        data.log.push(additionExercise); 
        data.save((err, data) => {
          if(err) console.log(err);
          exerciseData = 
          { "username": data.username,
            "_id": data._id,
            "description": description,
            "duration": duration,
            "date": date.toDateString()
          }
          console.log(exerciseData)
          console.log(additionExercise)
          res.json(exerciseData)
        })
        
      }
    })
  } else {
    res.send("Please fill in all required fields.")
  }
})


app.get('/api/exercise/log', function(req, res, next) {
  
  let userId = req.query.userId;
  
  if(userId) {
    let from = req.query.from;
    let to = req.query.to;
    let limit = req.query.limit;
    const limitOptions = {};
    if (limit) limitOptions.limit = limit;
    
    user.findById(userId).populate({path:'log', match: {}, select: '-_id', options: limitOptions}).exec((err, data) => {
      
      if(err) next(err);
        if(data) {
          let displayData = {id: data.id, username: data.username, count: data.count}
          if (from) displayData.from = from.toDateString();
          if (to) displayData.to = to.toDateString();
          displayData.log = data.log.filter(item => {
            if (from && to) {
              return item.date >= from && item.date <= to;
            } else if (from) {
              return item.date >= from;
           } else if (to) {
             return item.date <= to;
           } else {
             return true;
           }
          })
          res.json(displayData)
        } else {
          next();
        }
    })    
  } else {
  res.send("UserId is required. For example, api/exercise/log?userId=554fejdcdd485fje")
  }
})

app.get('/api/exercise/users', function(req, res) {
  user.find({}, function(err, data) {
    if(err) err;
    let obj = data.map(item => {
      
      return `username:${item.username}, _id:${item._id}`;
     
    })
    res.json(obj);  
  });
})

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
