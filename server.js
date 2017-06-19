// Dependencies
var express = require("express");
var _ = require("underscore");
var bodyParser = require('body-parser');

// ExpressJS Setup
var app = express();
var router = express.Router();
var port = 8080;

// Our global list of "Things"
var things = { };
var counter = 1;

// Log every request
router.use(function (req,res,next) {
  next();
  console.log("%s %s => %d", req.method, req.originalUrl, res.statusCode);
});

// Any GET on / ends up with a nice documentation as JSON
router.get("/",function(req,res){
  var response = {
    name: "API Mockup",
    description: "A simple API Mockup tool",
    endpoints: {
      things: "/things/"
    },
    documentation: {
      "GitHub": "https://github.com/nmasse-itix/API-Mockup.git"
    }
  };
  success(res, 200, response);
});

// Get all things
router.get("/things",function(req,res){
  success(res, 200, _.values(things));
});

// Get a thing
router.get("/things/:id",function(req,res){
  var id = req.params.id;
  if (! (id in things)) {
    return error(res, 404, "No thing with this id");
  }

  success(res, 200, things[id]);
});

// Create a thing
router.post("/things",function(req,res){
  var thing = req.body;
  if (thing == null) {
    return error(res, 400, "No body sent !");
  }

  thing.id = counter++;
  things[thing.id] = thing;
  success(res, 201, thing);
});

// Delete a thing
router.delete("/things/:id",function(req,res){
  var id = req.params.id;
  if (! (id in things)) {
    return error(res, 404, "No thing with this id");
  }

  var thing = things[id];
  delete things[id]
  success(res, 202, thing);
});

// Update a thing
router.put("/things/:id",function(req,res){
  var thing = req.body;
  if (thing == null) {
    return error(res, 400, "No body sent !");
  }

  var id = req.params.id;
  if (! (id in things)) {
    return error(res, 404, "No thing with this id");
  }

  if (thing.id != id) {
    return error(res, 400, "The id cannot be updated");
  }

  things[id] = thing;
  success(res, 202, thing);
});

//
// Please find below the plumbing code
//

// Register the JSON Parser for POST and PUT requests
app.use(bodyParser.json());

// Register the router
app.use("/",router);

// 404 Handler (Not Found)
app.use("*",function(req,res){
  error(res, 404, "Not found");
});

// Start the HTTP Server
app.listen(port,function(){
  console.log("API Mockup listening at port %d", port);
});

function error(res, code, message) {
  var response = {
    status: code,
    message: message
  };
  return res.status(code)
            .type("application/json")
            .send(JSON.stringify(response));
}

function success(res, code, response) {
  return res.status(code)
            .type("application/json")
            .send(JSON.stringify(response));
}
