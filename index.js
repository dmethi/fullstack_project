// include the express module
var express = require("express");

// create an express application
var app = express();

// helps in extracting the body portion of an incoming request stream
var bodyparser = require('body-parser');

// fs module - provides an API for interacting with the file system
var fs = require("fs");

// helps in managing user sessions
var session = require('express-session');

// native js function for hashing messages with the SHA-256 algorithm
var crypto = require('crypto');

// include the mysql module
var mysql = require("mysql");

var con = mysql.createConnection({
  connectionLimit: 100,
  host: "us-cdbr-east-02.cleardb.com",
  user: "bc2bd9df408bf1", // replace with the database user provided to you
  password: "077a95e3", // replace with the database password provided to you
  database: "heroku_788db6f248232b5", // replace with the database user provided to you
  port: 3306
});

const xml2js = require('xml2js');

// apply the body-parser middleware to all incoming requests
app.use(bodyparser());

// use express-session
// in mremory session is sufficient for this assignment
app.use(session({
  secret: "csci4131secretkey",
  saveUninitialized: true,
  resave: false
}));

// server listens on port 9766 for incoming connections
app.listen(process.env.PORT || 9766, () => console.log('Listening on port 9766!'));

app.get('/',function(req, res) {
  res.sendFile(__dirname + '/client/welcome.html');
});

// // GET method route for the events page.
// It serves events.html present in client folder
app.get('/events',function(req, res) {
  //Add Details
  
  // check session value
  
  if(!req.session.value) {
  	console.log('user not logged in -- trying to access events');
		res.redirect('/login');  
  } else {
    // insert code for events page
    
    res.sendFile(__dirname + '/client/events.html');
  }
});

// GET method route for the addEvent page.
// It serves addEvent.html present in client folder
app.get('/addEvent',function(req, res) {
  //Add Details
  
  // check session value
  
  if(!req.session.value) {
  		console.log('user not logged in -- trying to access add_events');
		res.redirect('/login');  
  } else {
    // insert code for addEvents page 
     
    res.sendFile(__dirname + '/client/addEvent.html');
  }
});

app.get('/userLogin', function(req, res) {
  console.log(req.session.user);
  res.send(req.session.user);
})

//GET method for stock page
app.get('/stock', function (req, res) {
  //Add Details
  
  // check session value
  
  if(!req.session.value) {
  		console.log('user not logged in -- trying to access stocks');
		res.redirect('/login');  
  } else {
    // insert code for stocks page 
     
    res.sendFile(__dirname + '/client/stock.html');
  }
});

// GET method route for the login page.
// It serves login.html present in client folder
app.get('/login',function(req, res) {
  //Add Details
  res.sendFile(__dirname + '/client/login.html');
});

// GET method to return the list of events
// The function queries the tbl_events table for the list of events and sends the response back to client
app.get('/getListOfEvents', function(req, res) {
  //Add Details

  // establish connection

  // write SQL query
  var sql = 'SELECT * FROM tbl_events';

  // send query
  con.query(sql, function(err, rows, fields) {
    if (err) {
      throw err;
    }

    var eventsArray = [];

    for (var i = 0; i < rows.length; i++) {
      var temp_object = {};
      temp_object.day = rows[i].event_day;
      temp_object.event = rows[i].event_event;
      temp_object.start = rows[i].event_start;
      temp_object.end = rows[i].event_end;
      temp_object.location = rows[i].event_location;
      temp_object.phone = rows[i].event_phone;
      temp_object.info = rows[i].event_info;
      temp_object.url = rows[i].event_url;

      eventsArray.push(temp_object);
    }
    
    returnObj = {"events":eventsArray};
    responseObj = {res:returnObj};
    JSON.stringify(responseObj);
    res.send(responseObj);
  })
});

// POST method to insert details of a new event to tbl_events table
app.post('/postEvent', function(req, res) {
  //Add Details

  var content = req.body;

// sample comment to repush

  var table_entry = {
    event_day: content.day,
    event_event: content.event,
    event_start: content.start,
    event_end: content.end,
    event_location: content.location,
    event_phone: content.phone,
    event_info: content.info,
    event_url: content.url,
  }

  con.query('INSERT tbl_events SET ?', table_entry, function(err, result) {
    if (err) {
      throw err;
    }
    console.log('values inserted');
  })

  res.redirect('/events');

});

// POST method to validate user login
// upon successful login, user session is created
app.post('/sendLoginDetails', function(req, res) {
  //Add Details
  var loginInfo = req.body;
  var login = loginInfo.login;
  var password = loginInfo.password;

  var hashed_pw = crypto.createHash('sha256').update(password).digest('base64');
  var sql = 'SELECT acc_login, acc_password FROM tbl_accounts WHERE (acc_login="' + login + '" AND acc_password="' + hashed_pw + '")';
  console.log(sql);

  con.query(sql, function(err, rows, fields) {
    if (err) {
      throw err;
    }

    if (rows.length >= 1) {
      req.session.user = login;
      req.session.value = 1;
      res.json({status: 'success'});
    } else {
      res.json({status: 'fail'});
    }
  })
});

// log out of the application
// destroy user session
app.get('/logout', function(req, res) {
  //Add Details
  if(!req.session.value){
    res.send('Session not started, cannot logout'); 
  } else {
    console.log('Successfully destroyed session');
    req.session.destroy();
    res.redirect('/login');
  }
});

app.get('/admin', function(req, res) {
  if(!req.session.value) {
    console.log('user not logged in');
    res.redirect('/login');  
  } else {
  res.sendFile(__dirname + '/client/admin.html');
  }
})

// middle ware to serve static files
app.use('/client', express.static(__dirname + '/client'));

// get list of users -- admin page
app.get('/getListOfUsers', function(req, res) {
  // check session validity 
  if(!req.session.value) {
    console.log('user not logged in');
    res.redirect('/login');  
  } else {
  // establish connection
    const xml2js = require('xml2js');
    var parser = new xml2js.Parser();
    fs.readFile(__dirname + '/dbconfig.xml', (err, xml) => {
      parser.parseString(xml, (err, result) => {
        var con = mysql.createConnection({
          connectionLimit: 100,
          host: result.dbconfig.host[0],
          user: result.dbconfig.user[0], // replace with the database user provided to you
          password: result.dbconfig.password[0], // replace with the database password provided to you
          database: result.dbconfig.database[0], // replace with the database user provided to you
          port: result.dbconfig.port[0]
        });

        var sql = 'SELECT * FROM tbl_accounts';

        con.query(sql, function(err, rows, fields) {
          if (err) {
            throw err;
          }

          var objArray = [];

          for (var i = 0; i < rows.length; i++) {
            var temp_object = {
              id: rows[i].acc_id,
              name: rows[i].acc_name,
              login: rows[i].acc_login,
              password: rows[i].acc_password
            };
            console.log(temp_object);

            objArray.push(temp_object);
          }

          console.log(objArray);
          res.json(objArray);
        })
      })
    })
  }
})

app.post('/addUser', function(req, res) {
  if(!req.session.value) {
    console.log('user not logged in -- trying to access events');
    res.redirect('/login');  
  } else {
  // establish connection

    fs.readFile(__dirname + '/dbconfig.xml', (err, xml) => {
      var parser = new xml2js.Parser();
      parser.parseString(xml, (err, result) => {
        var con = mysql.createConnection({
          connectionLimit: 100,
          host: result.dbconfig.host[0],
          user: result.dbconfig.user[0], // replace with the database user provided to you
          password: result.dbconfig.password[0], // replace with the database password provided to you
          database: result.dbconfig.database[0], // replace with the database user provided to you
          port: result.dbconfig.port[0]
        });

        var sql = "SELECT * FROM tbl_accounts WHERE (acc_login ='" + req.body.login + "')";

        con.query(sql, function(err, rows, fields) {
          if (err) {
            throw err;
          }

          if (rows.length >= 1) {
            res.send({flag: false});
          } else {
            var rowToBeInserted = {
              acc_id: req.body.id,
              acc_login: req.body.login,
              acc_name: req.body.name,
              acc_password: crypto.createHash('sha256').update(req.body.password).digest('base64')
            };
            console.log(rowToBeInserted);
            con.query('INSERT tbl_accounts SET ?', rowToBeInserted, function(err, resu) {
              if(err) {
                throw err;
              }
              res.send({flag: true, id: resu.insertId});
            })
          }
        })
      })
    })
  }
})

app.post('/updateUser', function(req, res) {
  if(!req.session.value) {
    console.log('user not logged in -- trying to access events');
    res.redirect('/login');  
  } else {
  // establish connection
    const xml2js = require('xml2js');
    var parser = new xml2js.Parser();
    fs.readFile(__dirname + '/dbconfig.xml', (err, xml) => {
      parser.parseString(xml, (err, result) => {
        var con = mysql.createConnection({
          connectionLimit: 100,
          host: result.dbconfig.host[0],
          user: result.dbconfig.user[0], // replace with the database user provided to you
          password: result.dbconfig.password[0], // replace with the database password provided to you
          database: result.dbconfig.database[0], // replace with the database user provided to you
          port: result.dbconfig.port[0]
        });

        var sql = 'SELECT * FROM tbl_accounts WHERE (acc_login = "' + req.body.login + '" AND acc_id != "' + req.body.id + '")';
        console.log('update user');
        console.log(req.body.login);
        console.log(req.body.id);

        con.query(sql, function(err, resu) {
          if (resu.length == 0) {
            if(req.body.password == null) {
              con.query('UPDATE tbl_accounts SET acc_name ="' + req.body.name + '" WHERE acc_id = "' + req.body.id + '"', function(err, r) {
                if(err) {
                  throw err;
                }
              })

              con.query('UPDATE tbl_accounts SET acc_login ="' + req.body.login + '" WHERE acc_id = "' + req.body.id + '"', function(err, r) {
                if(err) {
                  throw err;
                }
              })
            } else {
                con.query('UPDATE tbl_accounts SET acc_name ="' + req.body.name + '" WHERE acc_id = "' + req.body.id + '"', function(err, r) {
                if(err) {
                  throw err;
                }
              })

              con.query('UPDATE tbl_accounts SET acc_login ="' + req.body.login + '" WHERE acc_id = "' + req.body.id + '"', function(err, r) {
                if(err) {
                  throw err;
                }
              })

              var new_pass = crypto.createHash('sha256').update(req.body.password).digest('base64');
              con.query('UPDATE tbl_accounts SET acc_password ="' + new_pass + '" WHERE acc_id = "' + req.body.id + '"', function(err, r) {
                if(err) {
                  throw err;
                }
              })
            }

            res.send({flag: true});
          } else {
            res.send({flag: false});
          }
        })   

      })
    })
  }
})

app.post('/deleteUser', function(req, res) {
  if(!req.session.value) {
  console.log('user not logged in -- trying to access events');
  res.redirect('/login');  
  } else {
  // establish connection
  // sample text
    const xml2js = require('xml2js');
    var parser = new xml2js.Parser();
    fs.readFile(__dirname + '/dbconfig.xml', (err, xml) => {
      parser.parseString(xml, (err, result) => {
        var con = mysql.createConnection({
          connectionLimit: 100,
          host: result.dbconfig.host[0],
          user: result.dbconfig.user[0], // replace with the database user provided to you
          password: result.dbconfig.password[0], // replace with the database password provided to you
          database: result.dbconfig.database[0], // replace with the database user provided to you
          port: result.dbconfig.port[0]
        });

        if(req.body.login != req.session.user) {
          con.query('DELETE FROM tbl_accounts WHERE acc_login = "' + req.body.login + '"');
          res.send({flag: true});
        } else {
          res.send({flag: false});
        }
      })
    })
  }
})

// function to return the 404 message and error to client
app.get('*', function(req, res) {
  // add details
  res.send('404 Error: file not found');
});

