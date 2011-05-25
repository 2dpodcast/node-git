var testCase = require('nodeunit').testCase,
  Repo = require('../lib/git').Repo,
  fs = require('fs'),
  FileIndex = require('../lib/git').FileIndex;

var fixture = function(name, trim) {
  return trim ? fs.readFileSync("./test/fixtures/" + name, 'ascii').trim() : fs.readFileSync("./test/fixtures/" + name, 'ascii');
}

module.exports = testCase({   
  setUp: function(callback) {
    callback();
  },
  
  tearDown: function(callback) {
    callback();
  },

  "Count all entries":function(assert) {
    new FileIndex("./test/dot_git", function(err, file_index) {
      file_index.count_all(function(err, count) {
        assert.equal(107, count);
        assert.done();
      })
    });    
  },
  
  "Count for a given sha":function(assert) {
    var commit = "c12f398c2f3c4068ca5e01d736b1c9ae994b2138";
    
    new FileIndex("./test/dot_git", function(err, file_index) {
      file_index.count(commit, function(err, count) {
        assert.equal(20, count);
        assert.done();
      })
    });
  },
  
  "Retrieve all files for a commit":function(assert) {
    var commit = "c12f398c2f3c4068ca5e01d736b1c9ae994b2138";
    
    new FileIndex("./test/dot_git", function(err, file_index) {
      file_index.files(commit, function(err, files) {
        assert.equal(4, files.length);
        assert.equal("lib/grit/blob.rb", files[0]);
        assert.done();
      })
    });
  },
  
  "Retrieve all commits for a given file":function(assert) {
    var commit = "c12f398c2f3c4068ca5e01d736b1c9ae994b2138";
    
    new FileIndex("./test/dot_git", function(err, file_index) {
      file_index.commits_for('lib/grit/blob.rb', function(err, commits) {
        assert.ok(commits.indexOf("3e0955045cb189a7112015c26132152a94f637bf") != -1);
        assert.equal(8, commits.length)
        assert.done();
      })
    });    
  },
  
  "Retrieve array of last commits":function(assert) {
    var commit = "c12f398c2f3c4068ca5e01d736b1c9ae994b2138";
    
    new FileIndex("./test/dot_git", function(err, file_index) {
      file_index.last_commits(commit, ['lib/grit/git.rb', 'lib/grit/actor.rb', 'lib/grit/commit.rb'], function(err, commits_by_file) {
        assert.equal('74fd66519e983a0f29e16a342a6059dbffe36020', commits_by_file['lib/grit/git.rb']);
        assert.equal(commit, commits_by_file['lib/grit/commit.rb']);
        assert.equal(null, commits_by_file['lib/grit/actor.rb']);
        assert.done();
      })
    });    
  },
  
  "Retrieve array of last commits based on regexp pattern":function(assert) {
    var commit = "c12f398c2f3c4068ca5e01d736b1c9ae994b2138";
    
    new FileIndex("./test/dot_git", function(err, file_index) {
      file_index.last_commits(commit, /lib\/grit\/[^\/]*$/, function(err, commits_by_file) {
        assert.equal(10, Object.keys(commits_by_file).length);
        assert.equal(commit, commits_by_file['lib/grit/commit.rb']);
        assert.equal(null, commits_by_file['lib/grit/actor.rb']);
        assert.done();
      })
    });        
  },
  
  "Retrieve last commits containing a directory in array":function(assert) {
    var commit = "c12f398c2f3c4068ca5e01d736b1c9ae994b2138";
    
    new FileIndex("./test/dot_git", function(err, file_index) {
      file_index.last_commits(commit, ['lib/grit.rb', 'lib/grit/'], function(err, commits_by_file) {
        assert.equal(commit, commits_by_file['lib/grit/']);
        assert.done();
      })
    });    
  }
});

















