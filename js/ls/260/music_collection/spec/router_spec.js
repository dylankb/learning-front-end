var request = require('request');
var root = 'http://localhost:3000/';
var albums;

describe('JSON Routes', function() {
  describe('/album.json', function() {
    // Callback params example here: https://github.com/mhevery/jasmine-node
    it('returns an array of albums', function(done) {
      request(root + 'albums.json', function(error, response, body) {
        console.log(body);
        albums = JSON.parse(body);
        expect(albums[0].artist).toBeDefined();
        done();
      });
    });
  });

  describe('albums/<album>.json', function() {
    it('returns an array of tracks', function(done) {
      request(root + 'albums/' + albums[0].title + '.json', function(e, res, body) {
        expect(JSON.parse(body)[0]).toBeDefined();
        done();
      });
    });
  });
});
