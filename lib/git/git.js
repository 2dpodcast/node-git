var sys = require('sys'),
    fs = require('fs'),
    GitFileOperations = require('git/git_file_operations').GitFileOperations,
    exec = require('child_process').exec;

var Git = exports.Git = function(git_directory) {
  var _git_diretory = git_directory;
  // Control access to internal variables
  Object.defineProperty(this, "git_directory", { get: function() { return _git_diretory; }, set: function(value) { _git_diretory = value; }, enumerable: true});    
}

// Set up the gitbinary
if(process.platform.toLowerCase().match(/mswin(?!ce)|mingw|bccwin/)) {
  Git.git_binary = "git";
} else {
  Git.git_binary = "/usr/bin/env git";
}

// Chomp text removing end carriage returns
var chomp = function chomp(raw_text) {
  return raw_text.replace(/(\n|\r)+$/, '');
}

var read_file = function(path, callback) {
  fs.stat(path, function(err, stat) {
    if(err) return callback(err, null);  
    fs.readFile(path, 'ascii', callback);      
  })
}

// Retrieve references
Git.prototype.refs = function(options, prefix, callback) {
  // Locate all files in underlying directories
  GitFileOperations.glob(this.git_directory, function(err, files) {
  });
}

// Read a specific file
Git.prototype.fs_read = function(file, callback) {
  GitFileOperations.fs_read(this.git_directory, file, callback);
}

// Parse revisions
Git.prototype.rev_parse = function(options, string, callback) {
 if(string == null || string.constructor != String) return callback("invalid string: " + string);
 var self = this;
 
 // Make sure we don't have a directory up ..
 if(string.match(/\.\./)) {
   var shas = string.split(/\.\./);
   var sha1 = shas[0], sha2 = shas[1];   
   // Need to rev_parse the two keys and return the data
   new Simplifier().execute(new ParallelFlow(
      function(callback) { self.rev_parse({}, sha1, callback); },
      function(callback) { self.rev_parse({}, sha2, callback); }
     ), function(sha1_results, sha2_results) {
     // Return the collected files
     return callback(null, [sha1_results[1], sha2_results[1]]);
   });
 }
 
 // If we have a sha being returned nop it
 if(string.match(/^[0-9a-f]{40}$/)) {
   return callback(null, chomp(string));
 }
 
 // Check in heads directory
 read_file(self.git_directory + "/refs/heads/" + string, function(err, data) {
   if(!err) return fs.readFile(self.git_directory + "/refs/heads/" + string, function(err, data) { callback(err, chomp(data)); });
   // If not in heads then check in remotes
   read_file(self.git_directory + "/refs/remotes/" + string, function(err, data) {
     if(!err) return fs.readFile(self.git_directory + "/refs/remotes/" + string, function(err, data) { callback(err, chomp(data)); });
     // If not in remotes check in tags
     read_file(self.git_directory + "/refs/tags/" + string, function(err, data) {
       if(!err) return fs.readFile(self.git_directory + "/refs/tags/" + string, function(err, data) { callback(err, chomp(data)); });

       // Not pin any of the main refs, look in packed packed-refs
       read_file(self.git_directory + "/packed-refs", function(err, data) {
         if(err) return callback(err, data);
         // Split the data on new line
         var ref = null;
         var parts = data.split(/\n/);
         // Locate head
         for(var i = 0; i < parts.length; i++) {
           var match_parts = parts[i].match(/^(\w{40}) refs\/.+?\/(.*?)$/);
           if(match_parts) {             
             ref = match_parts[1];
             // If we have a match fetch reference and return
             if(new RegExp(string + '$').test(match_parts[3])) {
               break;
             }
           }           
         }
         // If we have a reference lets terminate
         if(ref) return callback(null, ref);         

         // !! more partials and such !!
         
         // revert to calling git 
         self.call_git('', 'rev-parse', '', options, string, function(err, result) {
           result = result ? chomp(result) : result;
           callback(err, result);
         })
       });
       
     });
   });
 });
}

var transform_options = function(options) {
  var args = [];
  var keys = Object.keys(options);
  
  // Process all entries
  Object.keys(options).forEach(function(key) {
    if(key.length == 1) {
      if(options[key] == true && options[key].constructor == Boolean) { args.push("-" + key);        
      } else if(options[key] == false && options[key].constructor == Boolean) {
      } else { args.push("-" + key + " '" + options[key].toString() + "'"); }
    } else {
      if(options[key] == true && options[key].constructor == Boolean) { args.push("--" + key.toString().replace(/_/, '-'));
      } else if(options[key] == false && options[key].constructor == Boolean) {        
      } else { args.push("--" + key.toString().replace(/_/, '-') + "='" + options[key] + "'"); }
    }
  });    
  // Return formated parametes
  return args;
}

// Call the native git binary
Git.prototype.call_git = function(prefix, command, postfix, options, args, callback) {
  ///usr/bin/env git --git-dir='/Users/christian.kvalheim/coding/checkouts/grit/test/dot_git' rev-parse 'master'
  // Do we have a timeout 
  var timeout = options['timeout'] ? timeout : 1000 * 60;
  // Remove the timeout property if we have one
  if(options['timeout']) delete options['timeout'];
  var option_arguments = transform_options(options);
  
  if(process.platform.toLowerCase().match(/mswin(?!ce)|mingw|bccwin/)) {    
  } else {
    // Map the extra parameters
    var ext_args = args.map(function(arg) { return (arg == '--' || arg.substr(0, 1) == '|' ? arg : ("\"" + arg + "\""))})
                    .filter(function(arg) { return arg == null || arg == '' ? false : true});
    // Join the arguments
    var final_arguments = option_arguments.concat(ext_args);
    // Build a call
    var call = prefix + Git.git_binary + " --git-dir='" + this.git_directory + "' " + command.toString().replace(/_/, '-') + " " + final_arguments.join(' ') + postfix;
  }  

  // Execute the git command
  exec(call, { encoding: 'utf8', timeout: timeout, killSignal: 'SIGKILL'},          
    function (error, stdout, stderr) {
      if (error !== null) { 
        callback(error, null);
      } else {
        callback(null, stdout)
      }
  });        
}

// Fetch a revision list
Git.prototype.rev_list = function(options, reference, callback) {
  var args = Array.prototype.slice.call(arguments, 0);
  callback = args.pop();
  // Execute git call
  this.call_git('', 'rev_list', '', options, [reference], function(err, result) {
    callback(err, result);
  })
}





















