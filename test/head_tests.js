require.paths.unshift("./spec/lib", "./lib", "./external-libs/node-httpclient/lib", "./external-libs/node-xml/lib",
  "./external-libs/node-async-testing");

var TestSuite = require('async_testing').TestSuite,
  sys = require('sys'),
  Repo = require('git/repo').Repo,
  Ref = require('git/ref').Ref,
  Head = require('git/head').Head,
  Blob = require('git/blob').Blob,
  Tree = require('git/tree').Tree,
  Commit = require('git/commit').Commit,
  GitFileOperations = require('git/git_file_operations').GitFileOperations,
  fs = require('fs'),
  exec  = require('child_process').exec;

var suite = exports.suite = new TestSuite("repo tests");

var create_tmp_directory = function(clone_path, callback) {
  var filename = 'git_test' + new Date().getTime().toString() + Math.round((Math.random(100000) * 300)).toString();
  var tmp_path = '/tmp/' + filename;
  // Create directory
  fs.mkdirSync(tmp_path, 0777);
  // Copy the old directory to the new one
  var child = exec('cp -R ' + clone_path + ' ' + tmp_path, function (error, stdout, stderr) {
      sys.print('stdout: ' + stdout);
      sys.print('stderr: ' + stderr);
      if (error !== null) {
        sys.puts('exec error: ' + error);
        return callback(error, null);
      }
      return callback(null, tmp_path + '/dot_git');    
  });
}

var fixture = function(name) {
  fs.readFileSync("./test/fixtures/" + name);
}

var destroy_directory = function(directory, callback) {
  // Copy the old directory to the new one
  var child = exec('rm -rf ' + directory, function (error, stdout, stderr) {
      sys.print('stdout: ' + stdout);
      sys.print('stderr: ' + stderr);
      if (error !== null) {
        sys.puts('exec error: ' + error);
        return callback(error, null);
      }
      return callback(null, null);    
  });  
}

/**
  Test basic node-git functionality
**/
suite.addTests({
  // "Should update refs packed":function(assert, finished) {
  //   create_tmp_directory("./test/dot_git", function(err, target_path) {
  //     var repo = new Repo(target_path, {is_bare:true});
  //     
  //     // new and existing
  //     var test   = 'ac9a30f5a7f0f163bbe3b6f0abf18a6c83b06872'
  //     var master = 'ca8a30f5a7f0f163bbe3b6f0abf18a6c83b0687a'
  //     
  //     repo.update_ref('testref', test, function(err, result) {
  //       repo.get_head('testref', function(err, head) {
  //         assert.ok(head.commit.sha != master);
  // 
  //         repo.update_ref('testref', test, function(err, result) {
  //           repo.get_head('testref', function(err, head) {
  //             assert.ok(head.commit.sha != master)
  //           })
  //         })
  //       })
  //     });
  //     
  //     repo.get_head('nonpack', function(err, head) {
  //       var old = head.commit.sha;
  //       repo.update_ref('nonpack', test, function(err, result) {
  //         assert.ok(result.commit.sha != old);
  // 
  //         destroy_directory(target_path, function(err, result) {
  //           finished();        
  //         })
  //       })
  //     })      
  //   });    
  // },
  // 
  // "Should raise error on invalid repo location":function(assert, finished) {
  //   try {
  //     var repo = new Repo('/tmp');
  //   } catch(err) {
  //     finished();
  //   }
  // },
  // 
  // "Should raise error on non existing path":function(assert, finished) {
  //   try {
  //     var repo = new Repo('/foobar');
  //   } catch(err) {
  //     finished();
  //   }
  // },
  // 
  // // Description
  // "Should correctly retrieve the description":function(assert, finished) {
  //   var repo = new Repo("./..");
  //   repo.description(function(err, description) {
  //     assert.ok(description.indexOf("Unnamed repository; edit this file") != -1);
  //     finished();
  //   })
  // },
  // 
  // // Refs
  // "Should correctly return array of ref objects":function(assert, finished) {
  //   var repo = new Repo("./..");
  //   repo.refs(function(err, refs) {
  //     refs.forEach(function(ref) {
  //       assert.ok(ref instanceof Ref);
  //     })
  //     
  //     finished();
  //   })    
  // },
  
  // Heads
  "Should correctly return the current head":function(assert, finished) {
    var repo = new Repo("./test/dot_git", {is_bare:true});
    repo.head(function(err, head) {
      assert.ok(head instanceof Head);
      assert.equal('master', head.name);
      
      repo.commits(head.name, function(err, commits) {
        assert.equals('ca8a30f5a7f0f163bbe3b6f0abf18a6c83b0687a', commits[0].id);
        finished();
      });
    })
  },
  
  // "Should correcty return array of head objects":function(assert, finished) {
  //   var repo = new Repo("./..", {is_bare:true});
  //   repo.heads(function(err, heads) {
  //     heads.forEach(function(head) {
  //       assert.ok(head instanceof Head);        
  //     })
  //     finished();
  //   })
  // },
  // 
  // "Should populate head data":function(assert, finished) {
  //   var repo = new Repo("./test/dot_git", {is_bare:true});
  //   repo.heads(function(err, heads) {
  //     var head = heads[0];
  //     
  //     assert.equals('test/master', head.name);
  //     head.commit(function(err, commit) {
  //       assert.equals('2d3acf90f35989df8f262dc50beadc4ee3ae1560', commit.id);
  //       finished();
  //     })
  //   })
  // },
  // 
  // // Commits
  // 
  // "Should correctly fetch commits":function(assert, finished) {
  //   var repo = new Repo("./..", {is_bare:true});
  //   Git.prototype.rev_list = function() { return fixture('rev_list')};
  //   
  //   repo.commits('master', 10, function(err, commits) {
  //     var commit = commits[0];
  //     
  //     assert.equals('4c8124ffcf4039d292442eeccabdeca5af5c5017', c.id);
  //     commit.parents(function(err, p_commits) {
  //       var p_commit_ids = p_commits.map(function(p_commit) {
  //         return p_commit.id;
  //       })
  //       assert.deepEqual(["634396b2f541a9f2d58b00be1a07f0c358b999b3"], p_commit_ids);
  //     })
  //     
  //     assert.equals('672eca9b7f9e09c22dcb128c283e8c3c8d7697a4', commit.tree.id);
  //     assert.equals('Tom Preston-Werner', commit.author.name);
  //     assert.equals('tom@mojombo.com', commit.author.email);
  //     assert.equals(new Date(1191999972*1000), commit.authored_date);
  //     assert.equals('Tom Preston-Werner', commit.committer.name);
  //     assert.equals('tom@mojombo.com', commit.committer.email);
  //     assert.equals(new Date(1191999972*1000), commit.committed_date);
  //     assert.equals('implement Grit#heads', commit.message);
  //     
  //     commit = commits[1];
  //     commit.parents(function(err, p_commits) {
  //       assert.deepEqual([], p_commits);
  //     })
  //     
  //     commit = commits[2]
  //     commit.parents(function(err, p_commits) {
  //       var p_commit_ids = p_commits.map(function(p_commit) {
  //         return p_commit.id;
  //       })        
  //       assert.deepEqual(["6e64c55896aabb9a7d8e9f8f296f426d21a78c2c", "7f874954efb9ba35210445be456c74e037ba6af2"], p_commit_ids);
  //     })
  //     assert.equals("Merge branch 'site'\n\n  * Some other stuff\n  * just one more", commit.message);
  //     assert.equals("Merge branch 'site'", commit.short_message);
  //     finished();
  //   })
  // },
  // 
  // // commit count
  // "Should correctly retrieve the commit count":function(assert, finished) {
  //   var repo = new Repo("./..", {is_bare:true});
  //   repo.commit('634396b2f541a9f2d58b00be1a07f0c358b999b3', function(err, commit) {
  //     assert.equals('634396b2f541a9f2d58b00be1a07f0c358b999b3', commit.id);
  //     finished();
  //   })
  // }
  // 
  // // tree
  // "Should correctly retrieve the repo tree":function(assert, finished) {
  //   var repo = new Repo("./..", {is_bare:true});
  //   Git.prototype.ls_tree = function() { return fixture('ls_tree_a')};    
  //   
  //   repo.tree('master', function(err, tree) {
  //     tree.contents(function(err, entries) {
  //       var entries_1 = entries.filter(function(entry) { return entry instanceof Blob; })
  //       var entries_2 = entries.filter(function(entry) { return entry instanceof Tree; })
  //       assert.equals(4, entries_1.length);
  //       assert.equals(3, entries_2.length);
  //       finished();
  //     });
  //   });
  // },
  // 
  // // blob
  // "Should correctly fetch blog instance":function(assert, finished) {
  //   var repo = new Repo("./..", {is_bare:true});
  //   Git.prototype.cat_file = function() { return fixture('cat_file_blob')};    
  //   
  //   repo.blob("abc", function(err, blob) {
  //     assert.equals("Hello world", blob.data);
  //     finished();
  //   })    
  // },
  // 
  // // init_bare
  // "Should correctly init bare":function(assert, finished) {
  //   GitFileOperations.prototype.mkdir_p = function() { return null; }
  //   Git.prototype.init = function() { return true; }
  //   
  //   Repo.init_bare("/foo/bar.git", function(err, result) {
  //     finished();
  //   })
  // },
  // 
  // "Should correctly init bare with options":function(assert, finished) {
  //   GitFileOperations.prototype.mkdir_p = function() { return null; }    
  //   Git.prototype.init = function() { return true; }
  //   
  //   Repo.init_bare('/foo/bar.git', {template:'/baz/sweet'}, function(err, result) {
  //     finished();
  //   });
  // },
  // 
  // // fork_bare
  // "Should correctly fork_bare":function(assert, finished) {
  //   GitFileOperations.prototype.mkdir_p = function() { return null; }    
  //   Git.prototype.clone = function() { return null; }
  //   
  //   var repo = new Repo("./..", {is_bare:true});
  //   repo.fork_bare('/foo/bar.git', {template:'/awesome'}, function(err result) {
  //     finished();
  //   })    
  // },
  // 
  // // diff
  // "Should correctly do a diff between two entries":function(assert, finished) {
  //   var repo = new Repo("./..", {is_bare:true});
  // 
  //   Git.prototype.diff = function(a, b, c, d) { 
  //       assert.deepEqual({}, a);
  //       assert.equals('master^', b);
  //       assert.equals('master', c);
  //       assert.equals('--', d);
  //     }
  //   repo.diff('master^', 'master', function(err, result) {});
  // 
  //   Git.prototype.diff = function(a, b, c, d, e) { 
  //       assert.deepEqual({}, a);
  //       assert.equals('master^', b);
  //       assert.equals('master', c);
  //       assert.equals('--', d);
  //       assert.equals('foo/bar', e);
  //     }
  //   repo.diff('master^', 'master', 'foo/bar', function(err, result) {});
  // 
  //   Git.prototype.diff = function(a, b, c, d, e, f) { 
  //       assert.deepEqual({}, a);
  //       assert.equals('master^', b);
  //       assert.equals('master', c);
  //       assert.equals('--', d);
  //       assert.equals('foo/bar', e);
  //       assert.equals('foo/baz', f);
  //     }
  //   repo.diff('master^', 'master', 'foo/bar', 'foo/baz', function(err, result) {});    
  //   finished();
  // },
  // 
  // // commit_diff
  // "Should correctly do a commit diff":function(assert, finished) {
  //   var repo = new Repo("./..", {is_bare:true});    
  //   Git.prototype.diff = function() { returns fixture('diff_p'); }
  // 
  //   repo.commit_diff('master', function(err, diffs) {
  //     assert.equals(15, diffs.length);
  //   });
  // },
  // 
  // // alternates
  // "Should correctly locate alternates":function(assert, finished) {
  //   var repo = new Repo("./..", {is_bare:true});
  //   GitFileOperations.prototype.exists = function(path) { 
  //     assert.equals('../.git/objects/info/alternates', path);
  //     return true; }        
  //   GitFileOperations.prototype.read = function(path) { 
  //     assert.equals('../.git/objects/info/alternates', path);
  //     return '/path/to/repo1/.git/objects\n/path/to/repo2.git/objects\n'; }
  // 
  //   repo.alternates(function(err, alternates) {
  //     assert.deepEqual(["/path/to/repo1/.git/objects", "/path/to/repo2.git/objects"], alternates);
  //     finished();
  //   })    
  // },
  // 
  // "Should fail to retrieve alternates":function(assert, finished) {
  //   var repo = new Repo("./..", {is_bare:true});
  //   GitFileOperations.prototype.exists = function(path) { return false; }
  //   repo.alternates(function(err, alternates) {
  //     assert.deepEqual([], alternates);
  //     finished();
  //   });
  // },
  // 
  // // set alternates
  // "Should correctly set alternates":function(assert, finished) {
  //   var repo = new Repo("./..", {is_bare:true});
  //   var alts = {"/path/to/repo.git/objects":1, "/path/to/repo2.git/objects":1};
  //   var alts_array = ["/path/to/repo.git/objects", "/path/to/repo2.git/objects"];
  // 
  //   GitFileOperations.prototype.exists = function(path) { 
  //     assert.ok(!alts[path]);
  //     return true; }
  //     
  //   GitFileOperations.prototype.write = function() { return alts_array.join("\n"); }
  //   
  //   repo.set_alternates(alts_array, function(err, result) {
  //     assert.ok(!err);
  //     finished();
  //   });   
  // },
  // 
  // "Should fail to set alternates":function(assert, finished) {
  //   var repo = new Repo("./..", {is_bare:true});
  //   var alts = {"/path/to/repo.git/objects":1};
  //   var alts_array = ["/path/to/repo.git/objects"];
  //   
  //   GitFileOperations.prototype.exists = function(path) { 
  //     assert.ok(!alts[path]);
  //     return true; }
  // 
  //   repo.set_alternates(alts_array, function(err, result) {
  //     assert.ok(err);
  //     finished();
  //   });       
  // },
  // 
  // "Should set empty alternates":function(assert, finished) {
  //   GitFileOperations.prototype.write = function() { return true; }
  //   repo.set_alternates([], function(err, result) {
  //     assert.ok(!err);
  //     finished();
  //   });    
  // },
  // 
  // // log
  // "Should correctly test log":function(assert, finished) {
  //   var repo = new Repo("./..", {is_bare:true});
  // 
  //   Git.prototype.log = function(a, b) { 
  //     assert.deepEqual({pretty:'raw'}, a);
  //     assert.equals('master', b);
  //     return fixture('rev_list'); }
  //   
  //   repo.log(function(err, log_items) {
  //     assert.equals('4c8124ffcf4039d292442eeccabdeca5af5c5017', log_items[0].id);
  //     assert.equals('ab25fd8483882c3bda8a458ad2965d2248654335', log_items[log_items.length - 1].id);
  //     finished();
  //   });    
  // },
  // 
  // "Should test log with path and options":function(assert, finished) {
  //   var repo = new Repo("./..", {is_bare:true});
  // 
  //   Git.prototype.log = function(a, b, c, d) { 
  //     assert.deepEqual({pretty:'raw', max_count:1}, a);
  //     assert.equals('master', b);
  //     assert.equals('--', c);
  //     assert.equals('file.rb', d);
  //     return fixture('rev_list'); }    
  //     
  //   repo.log(function(err, log_items) {
  //     assert.equals('4c8124ffcf4039d292442eeccabdeca5af5c5017', log_items[0].id);
  //     assert.equals('ab25fd8483882c3bda8a458ad2965d2248654335', log_items[log_items.length - 1].id);
  //     finished();
  //   });          
  // }
  // 
  // // commit_deltas_from
  // "Should correctly extract commit deltas from nothing new":function(assert, finished) {
  //   var repo = new Repo("./..", {is_bare:true});
  //   var other_repo = new Repo("./test/dot_git", {is_bare:true});
  // 
  //   repo.git.rev_list = function(a, b) {
  //       assert.deepEqual({}, a);
  //       assert.equals('master', b);
  //       return fixture('rev_list_delta_b');
  //     }
  // 
  //   other_repo.git.rev_list = function(a, b) {
  //       assert.deepEqual({}, a);
  //       assert.equals('master', b);
  //       return fixture('rev_list_delta_a');
  //     }
  //   
  //   repo.commit_deltas_from(other_repo, function(err, delta_blobs) {
  //     assert.equals(0, delta_blobs.length);
  //     finished();
  //   });
  // },
  // 
  // "Should commit deltas from when other has new":function(assert, finished) {
  //   var repo = new Repo("./..", {is_bare:true});
  //   var other_repo = new Repo("./test/dot_git", {is_bare:true});
  //   var commit_ids = {"4c8124ffcf4039d292442eeccabdeca5af5c5017":1, "634396b2f541a9f2d58b00be1a07f0c358b999b3":1, "ab25fd8483882c3bda8a458ad2965d2248654335":1};
  //   var commit_ids_array = ["4c8124ffcf4039d292442eeccabdeca5af5c5017", "634396b2f541a9f2d58b00be1a07f0c358b999b3", "ab25fd8483882c3bda8a458ad2965d2248654335"];
  // 
  //   repo.git.rev_list = function(a, b) {
  //       assert.deepEqual({}, a);
  //       assert.equals('master', b);
  //       return fixture('rev_list_delta_a');
  //     }
  // 
  //   other_repo.git.rev_list = function(a, b) {
  //       assert.deepEqual({}, a);
  //       assert.equals('master', b);
  //       return fixture('rev_list_delta_b');
  //     }
  //   
  //   Commit.find_all = function(a, b, c) {
  //       assert.equals(other_repo, a);
  //       assert.ok(commit_ids[b] != null);
  //       assert.deepEqual({max_count:1}, c);
  //       return [{}];
  //     }
  //   
  //   repo.commit_deltas_from(other_repo, function(err, delta_blobs) {
  //     assert.equals(3, delta_blobs.length);
  //     finished();
  //   })
  // },
  // 
  // // object_exist
  // "Should correctly select existing objects":function(assert, finished) {
  //   var repo = new Repo("./..", {is_bare:true});
  //   var before = ['634396b2f541a9f2d58b00be1a07f0c358b999b3', 'deadbeef'];
  //   var after = ['634396b2f541a9f2d58b00be1a07f0c358b999b3'];
  // 
  //   repo.git.select_existing_objects(before, function(err, objects) {
  //     assert.deepEqual(after, objects);
  //     finished();
  //   });
  // }
});



























