const request = require('supertest');
const assert = require('assert');

describe('server.js tests', function () {
  var server = require("../server.js");

  it("JSON Home", (done) => {
    request(server)
      .get('/')
      .expect('Content-Type', /^application[/]json/)
      .expect(200)
      .expect((res) => {
        assert.ok(res.body instanceof Object, "body is Object");
        assert.ok(res.body.documentation instanceof Object, "body.documentation is Object");
        assert.ok(res.body.documentation.GitHub != null, "body.documentation has a GitHub field");
        assert.ok(res.body.name != null, "body.name is not null");
        assert.ok(res.body.description != null, "body.description is not null");
        assert.ok(res.body.endpoints instanceof Object, "body.endpoints is Object");
      })
      .end(done);
  });

  it("Default config", (done) => {
    request(server)
      .get('/config')
      .expect('Content-Type', /^application[/]json/)
      .expect(200)
      .expect((res) => {
        assert.ok(res.body instanceof Object, "body is Object");
        assert.ok(res.body.things instanceof Object, "body.things is Object");
        assert.ok(res.body.things.fields instanceof Object, "body.things.fields has fields");
        assert.ok('name' in res.body.things.fields, "body.things.fields has a field named 'name'");
        assert.ok('price' in res.body.things.fields, "body.things.fields has a field named 'price'");
      })
      .end(done);
  });

  it("Default config (by id)", (done) => {
    request(server)
      .get('/config/things/')
      .expect('Content-Type', /^application[/]json/)
      .expect(200)
      .expect((res) => {
        assert.ok(res.body instanceof Object, "body is Object");
        assert.ok(res.body.fields instanceof Object, "body.things.fields has fields");
        assert.ok('name' in res.body.fields, "body.things.fields has a field named 'name'");
        assert.ok('price' in res.body.fields, "body.things.fields has a field named 'price'");
      })
      .end(done);
  });

  it("Get the swagger of the default config", (done) => {
    request(server)
      .get('/config/things/swagger')
      .expect('Content-Type', /^application[/]json/)
      .expect(200)
      .expect((res) => {
        assert.ok(res.body instanceof Object, "body is Object");
        assert.equal(res.body.info.title, "Mockup (things)", "search-and-replace worked");
        assert.equal(res.body.definitions.PersistedThing.properties.id.required, true, "PersistedThing have a mandatory id");
        assert.equal(res.body.definitions.Thing.properties.name.required, true, "Thing have a mandatory name");
        assert.equal(res.body.definitions.Thing.properties.price.required, true, "Thing have a mandatory price");
      })
      .end(done);
  });

  it("By default, the list of things is empty", (done) => {
    request(server)
      .get('/things/')
      .expect('Content-Type', /^application[/]json/)
      .expect(200)
      .expect((res) => {
        assert.ok(res.body instanceof Array, "body is Array");
        assert.equal(res.body.length, 0, "body has no item");
      })
      .end(done);
  });

  var id = null;
  it("We can create a new thing", (done) => {
    request(server)
      .post('/things/')
      .set('Content-Type', "application/json")
      .send({ name: "Cat", price: 10 })
      .expect('Content-Type', /^application[/]json/)
      .expect(201)
      .expect((res) => {
        assert.ok(res.body instanceof Object, "body is Object");
        assert.ok('id' in res.body, "the body contains an id");
        id = res.body.id;
      })
      .end(done);
  });

  it("The new thing is in the list of things", (done) => {
    request(server)
      .get('/things/')
      .expect('Content-Type', /^application[/]json/)
      .expect(200)
      .expect((res) => {
        assert.ok(res.body instanceof Array, "body is Array");
        assert.equal(res.body.length, 1, "body has one item");
        assert.equal(res.body[0].name, "Cat", "item[0].name == cat");
        assert.equal(res.body[0].price, 10, "item[0].price == 10");
        assert.equal(res.body[0].id, id, "ids should be equal");
      })
      .end(done);
  });

  it("Query the things by id", (done) => {
    request(server)
      .get('/things/' + encodeURIComponent(id) + '/')
      .expect('Content-Type', /^application[/]json/)
      .expect(200)
      .expect((res) => {
        assert.ok(res.body instanceof Object, "body is Object");
        assert.equal(res.body.name, "Cat", "item.name == cat");
        assert.equal(res.body.price, 10, "item.price == 10");
        assert.equal(res.body.id, id, "ids should be equal");
      })
      .end(done);
  });

  it("We can update the thing", (done) => {
    request(server)
      .put('/things/' + encodeURIComponent(id) + '/')
      .set('Content-Type', "application/json")
      .send({ name: "Dog", price: 9, id: id })
      .expect('Content-Type', /^application[/]json/)
      .expect(200)
      .expect((res) => {
        assert.equal(res.body.name, "Dog", "item.name == dog");
        assert.equal(res.body.price, 9, "item.price == 9");
        assert.equal(res.body.id, id, "ids should be equal");
      })
      .end(done);
  });

  it("Query the things by id and check updated fields", (done) => {
    request(server)
      .get('/things/' + encodeURIComponent(id) + '/')
      .expect('Content-Type', /^application[/]json/)
      .expect(200)
      .expect((res) => {
        assert.ok(res.body instanceof Object, "body is Object");
        assert.equal(res.body.name, "Dog", "item.name == dog");
        assert.equal(res.body.price, 9, "item.price == 9");
        assert.equal(res.body.id, id, "ids should be equal");
      })
      .end(done);
  });

  it("We can delete the thing", (done) => {
    request(server)
      .delete('/things/' + encodeURIComponent(id) + '/')
      .expect('Content-Type', /^application[/]json/)
      .expect(200)
      .expect((res) => {
        assert.equal(res.body.name, "Dog", "item.name == dog");
        assert.equal(res.body.price, 9, "item.price == 9");
        assert.equal(res.body.id, id, "ids should be equal");
      })
      .end(done);
  });

  it("Query the things by id and check it has been deleted", (done) => {
    request(server)
      .get('/things/' + encodeURIComponent(id) + '/')
      .expect('Content-Type', /^application[/]json/)
      .expect(404)
      .expect((res) => {
        assert.ok(res.body instanceof Object, "body is Object");
        assert.equal(res.body.status, 404, "body.status == 404");
      })
      .end(done);
  });
});
