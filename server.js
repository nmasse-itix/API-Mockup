// Dependencies
var express = require("express");
var _ = require("underscore");
var bodyParser = require('body-parser');
var util = require('util');

// ExpressJS Setup
var app = express();
var router = express.Router();
var port = 8080;

// Default config
var config = {
  "things": {
    "state": {
      "storage": {},
      "counter": 1
    },
    "config": {
      "fields": {
        "name": { "required": true },
        "price": { "required": true }
      }
    }
  }
};

var admin_endpoints = [
  { "url": "/debug/state", "verbs": [ "GET" ] },
  { "url": "/config/", "verbs": [ "GET" ] }
];

// Log every request
router.use(function (req,res,next) {
  next();
  console.log("%s %s => %d", req.method, req.originalUrl, res.statusCode);
});

// Dump the current state
router.get("/debug/state",function(req,res){
  success(res, 200,
    _.mapObject(config, (val, key) => {
       return val.state;
    })
  );
});

// Dump the current config
router.get("/config",function(req,res){
  success(res, 200,
    _.mapObject(config, (val, key) => {
       return val.config;
    })
  );
});

// Any GET on / ends up with a nice documentation as JSON
router.get("/",function(req,res){
  var response = {
    name: "API Mockup",
    description: "A simple API Mockup tool",
    endpoints: _.chain(config)
                .map((item, key) => {
                       return {
                         "url": util.format("/%s/", key),
                         "verbs": [ "GET", "POST", "PUT", "DELETE" ]
                       };
                     })
                .union(admin_endpoints)
                .value(),
    documentation: {
      "GitHub": "https://github.com/nmasse-itix/API-Mockup.git"
    }
  };
  success(res, 200, response);
});

// Get all things
router.get("/:object/",function(req,res){
  var resource = req.params.object;
  if (! (resource in config)) {
    return error(res, 400, util.format("There is no resource '%s', try one of those resources : %s", resource, _.keys(config).join(", ")));
  }
  success(res, 200, _.values(config[resource].state.storage));
});

// Get a thing
router.get("/:object/:id",function(req,res){
  var resource = req.params.object;
  if (! (resource in config)) {
    return error(res, 400, util.format("There is no resource '%s', try one of those resources : %s", resource, _.keys(config).join(", ")));
  }

  var id = req.params.id;
  if (! (id in config[resource].state.storage)) {
    return error(res, 404, util.format("No such resource '%s' with id '%s' !", resource, id));
  }

  success(res, 200, config[resource].state.storage[id]);
});

// Create a thing
router.post("/:object/",function(req,res){
  var resource = req.params.object;
  if (! (resource in config)) {
    return error(res, 400, util.format("There is no resource '%s', try one of those resources : %s", resource, _.keys(config).join(", ")));
  }

  var thing = req.body;
  if (thing == null) {
    return error(res, 400, "No body sent !");
  }

  thing.id = config[resource].state.counter++;
  config[resource].state.storage[thing.id] = thing;
  success(res, 201, thing);
});

// Delete a thing
router.delete("/:object/:id",function(req,res){
  var resource = req.params.object;
  if (! (resource in config)) {
    return error(res, 400, util.format("There is no resource '%s', try one of those resources : %s", resource, _.keys(config).join(", ")));
  }

  var id = req.params.id;
  if (! (id in config[resource].state.storage)) {
    return error(res, 404, util.format("No such resource '%s' with id '%s' !", resource, id));
  }

  var thing = config[resource].state.storage[id];
  delete config[resource].state.storage[id]
  success(res, 200, thing);
});

// Update a thing
router.put("/:object/:id",function(req,res){
  var resource = req.params.object;
  if (! (resource in config)) {
    return error(res, 400, util.format("There is no resource '%s', try one of those resources : %s", resource, _.keys(config).join(", ")));
  }

  var thing = req.body;
  if (thing == null) {
    return error(res, 400, "No body sent !");
  }

  var id = req.params.id;
  if (! (id in config[resource].state.storage)) {
    return error(res, 404, util.format("No such resource '%s' with id '%s' !", resource, id));
  }

  if (thing.id != id) {
    return error(res, 400, util.format("The id cannot be updated: '%s' vs '%s'", thing.id, id));
  }

  config[resource].state.storage[id] = thing;
  success(res, 200, thing);
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
var server = app.listen(port,function(){
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

module.exports = server; // Export the expressJS server object, to be used in unit tests
