require.paths.unshift("./spec/lib", "./lib", "./external-libs/node-httpclient/lib", "./external-libs/node-xml/lib",
  "./external-libs/node-async-testing");

TestSuite = require('async_testing').TestSuite,
  sys = require('sys'),
  Repo = require('git/repo').Repo,
  fs = require('fs'),
  Commit = require('git/commit').Commit;

var suite = exports.suite = new TestSuite("commit tests");

var fixture = function(name, trim) {
  return trim ? fs.readFileSync("./test/fixtures/" + name, 'ascii').trim() : fs.readFileSync("./test/fixtures/" + name, 'ascii');
}

suite.addTests({  
  // __bake__
  "Test commit bake":function(assert, finished) {
    new Repo("./test/dot_git", {is_bare:true}, function(err, repo) {
      repo.git.rev_list = function(a, b, callback) {
          callback(null, fixture('rev_list_single'));
        }
        
      var commit = new Commit(repo, '4c8124ffcf4039d292442eeccabdeca5af5c5017')
      assert.equal("Tom Preston-Werner", commit.author.name);
      assert.equal("tom@mojombo.com", commit.author.email);        
      finished();
    });    
  },
  
  // short_name
  "Test abbreviation of id":function(assert, finished) {
    new Repo("./test/dot_git", {is_bare:true}, function(err, repo) {
      repo.commit('80f136f500dfdb8c3e8abf4ae716f875f0a1b57f', function(err, commit) {
        commit.id_abbrev(function(err, id_abbrev) {
          assert.equal("80f136f", id_abbrev);
          finished();        
        })
      });
    });        
  },
  
  // count
  "Test commit count":function(assert, finished) {
    new Repo("./test/dot_git", {is_bare:true}, function(err, repo) {
      Commit.count(repo, 'master', function(err, count) {
        assert.equal(107, count);
        finished();
      })
    });    
  },
  
  // diff
  "Test correct execution of diff":function(assert, finished) {
    new Repo("./test/dot_git", {is_bare:true}, function(err, repo) {
      repo.git.diff = function(a, b, callback) {
          assert.equal(true, a['full_index']);
          assert.equal('master', b);        
          callback(null, fixture('diff_p'));
        }
        
      // Fetch the diff
      Commit.diff(repo, 'master', function(err, diffs) {
        assert.equal('.gitignore', diffs[0].a_path);
        assert.equal('.gitignore', diffs[0].b_path);
        assert.equal('4ebc8aea50e0a67e000ba29a30809d0a7b9b2666', diffs[0].a_blob.id);
        assert.equal('2dd02534615434d88c51307beb0f0092f21fd103', diffs[0].b_blob.id);
        assert.equal('100644', diffs[0].b_mode);
        assert.equal(false, diffs[0].new_file);
        assert.equal(false, diffs[0].deleted_file);
        assert.equal("--- a/.gitignore\n+++ b/.gitignore\n@@ -1 +1,2 @@\n coverage\n+pkg", diffs[0].diff);
        
        assert.equal('lib/grit/actor.rb', diffs[5].a_path);
        assert.equal(null, diffs[5].a_blob);
        assert.equal('f733bce6b57c0e5e353206e692b0e3105c2527f4', diffs[5].b_blob.id);
        assert.equal(true, diffs[5].new_file);
        finished();
      });
    });        
  },
  
  "Test diff with two commits":function(assert, finished) {
    new Repo("./test/dot_git", {is_bare:true}, function(err, repo) {
      repo.git.diff = function(a, b, c, callback) {
          assert.equal(true, a['full_index']);
          assert.equal('59ddc32', b);        
          assert.equal('13d27d5', c);        
          callback(null, fixture('diff_2'));
        }
        
      // Fetch the diff
      Commit.diff(repo, '59ddc32', '13d27d5', function(err, diffs) {
        assert.equal(3, diffs.length);
        assert.deepEqual(["lib/grit/commit.rb", "test/fixtures/show_empty_commit", "test/test_commit.rb"], diffs.map(function(diff) { return diff.a_path; }));
        finished();
      });
    });    
  }
});

















