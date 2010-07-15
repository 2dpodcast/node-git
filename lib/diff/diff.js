var sys = require('sys'),
  SequenceCallbacks = require('diff/callbacks').SequenceCallbacks,
  ContextChange = require('diff/change').ContextChange,
  Change = require('diff/change').Change,
  DiffCallbacks = require('diff/callbacks').DiffCallbacks;

var Difference = exports.Difference = function() {
  
}

Difference.LCS = function() {  
}

// Scope the Sequence Callbacks class
Difference.LCS.SequenceCallbacks = SequenceCallbacks;
Difference.LCS.ContextChange = ContextChange;
Difference.LCS.DiffCallbacks = DiffCallbacks;
Difference.LCS.Change = Change;

// Diff::LCS.diff computes the smallest set of additions and deletions
// necessary to turn the first sequence into the second, and returns a
// description of these changes.
// 
// See Diff::LCS::DiffCallbacks for the default behaviour. An alternate
// behaviour may be implemented with Diff::LCS::ContextDiffCallbacks.
// If a Class argument is provided for +callbacks+, //diff will attempt
// to initialise it. If the +callbacks+ object (possibly initialised)
// responds to //finish, it will be called.
Difference.LCS.diff = function(seq1, seq2, callbacks, block) {
  callbacks = callbacks != null ? callbacks : Difference.LCS.DiffCallbacks;
  
  if(Object.prototype.toString.call(callbacks) == "[object Function]") {
    callbacks = new callbacks();
  }
  
  // Traverse the sequence
  Difference.LCS.traverse_sequences(seq1, seq2, callbacks);  
  if(callbacks.finish != null) callbacks.finish();
  
  if(block != null) {    
    var res = callbacks.diffs.map(function(hunk) {
      if(Array.isArray(hunk)) {
        hunk = hunk.map(function(v) { return block(v); });
      } else {
        block(hunk);
      }
    });
    
    return res;
  } else {    
    return callbacks.diffs;
  }
}


// Diff::LCS.traverse_sequences is the most general facility provided by this
// module; +diff+ and +LCS+ are implemented as calls to it.
//
// The arguments to //traverse_sequences are the two sequences to
// traverse, and a callback object, like this:
//
//   traverse_sequences(seq1, seq2, Diff::LCS::ContextDiffCallbacks.new)
//
// //diff is implemented with //traverse_sequences.
//
// == Callback Methods
// Optional callback methods are <em>emphasized</em>.
//
// callbacks//match::               Called when +a+ and +b+ are pointing
//                                 to common elements in +A+ and +B+.
// callbacks//discard_a::           Called when +a+ is pointing to an
//                                 element not in +B+.
// callbacks//discard_b::           Called when +b+ is pointing to an
//                                 element not in +A+.
// <em>callbacks//finished_a</em>:: Called when +a+ has reached the end of
//                                 sequence +A+.
// <em>callbacks//finished_b</em>:: Called when +b+ has reached the end of
//                                 sequence +B+.
//
// == Algorithm
//       a---+
//           v
//       A = a b c e h j l m n p
//       B = b c d e f j k l m r s t
//           ^
//       b---+
//
// If there are two arrows (+a+ and +b+) pointing to elements of
// sequences +A+ and +B+, the arrows will initially point to the first
// elements of their respective sequences. //traverse_sequences will
// advance the arrows through the sequences one element at a time,
// calling a method on the user-specified callback object before each
// advance. It will advance the arrows in such a way that if there are
// elements <tt>A[ii]</tt> and <tt>B[jj]</tt> which are both equal and
// part of the longest common subsequence, there will be some moment
// during the execution of //traverse_sequences when arrow +a+ is pointing
// to <tt>A[ii]</tt> and arrow +b+ is pointing to <tt>B[jj]</tt>. When
// this happens, //traverse_sequences will call <tt>callbacks//match</tt>
// and then it will advance both arrows.
//
// Otherwise, one of the arrows is pointing to an element of its sequence
// that is not part of the longest common subsequence.
// //traverse_sequences will advance that arrow and will call
// <tt>callbacks//discard_a</tt> or <tt>callbacks//discard_b</tt>, depending
// on which arrow it advanced. If both arrows point to elements that are
// not part of the longest common subsequence, then //traverse_sequences
// will advance one of them and call the appropriate callback, but it is
// not specified which it will call.
//
// The methods for <tt>callbacks//match</tt>, <tt>callbacks//discard_a</tt>,
// and <tt>callbacks//discard_b</tt> are invoked with an event comprising
// the action ("=", "+", or "-", respectively), the indicies +ii+ and
// +jj+, and the elements <tt>A[ii]</tt> and <tt>B[jj]</tt>. Return
// values are discarded by //traverse_sequences.
//
// === End of Sequences
// If arrow +a+ reaches the end of its sequence before arrow +b+ does,
// //traverse_sequence try to call <tt>callbacks//finished_a</tt> with the
// last index and element of +A+ (<tt>A[-1]</tt>) and the current index
// and element of +B+ (<tt>B[jj]</tt>). If <tt>callbacks//finished_a</tt>
// does not exist, then <tt>callbacks//discard_b</tt> will be called on
// each element of +B+ until the end of the sequence is reached (the call
// will be done with <tt>A[-1]</tt> and <tt>B[jj]</tt> for each element).
//
// If +b+ reaches the end of +B+ before +a+ reaches the end of +A+,
// <tt>callbacks//finished_b</tt> will be called with the current index
// and element of +A+ (<tt>A[ii]</tt>) and the last index and element of
// +B+ (<tt>A[-1]</tt>). Again, if <tt>callbacks//finished_b</tt> does not
// exist on the callback object, then <tt>callbacks//discard_a</tt> will
// be called on each element of +A+ until the end of the sequence is
// reached (<tt>A[ii]</tt> and <tt>B[-1]</tt>).
//
// There is a chance that one additional <tt>callbacks//discard_a</tt> or
// <tt>callbacks//discard_b</tt> will be called after the end of the
// sequence is reached, if +a+ has not yet reached the end of +A+ or +b+
// has not yet reached the end of +B+.
Difference.LCS.traverse_sequences = function(seq1, seq2, callbacks, block) { // The block allows callbacks on change events
  // Ensure that we have at least a default callback object
  callbacks = callbacks != null ? callbacks : new Difference.LCS.SequenceCallbacks();
  // Fetch the matches from the __lcs algorithm
  var matches = Difference.LCS.__lcs(seq1, seq2);
  
  var run_finished_a = false, run_finished_b = false;
  var string = seq1.constructor == String;
  
  var a_size = seq1.length, b_size = seq2.length;
  var ai = 0, bj = 0;
  var event = null;
  
  for(var ii = 0; ii <= matches.length; ii++) {
    var b_line = matches[ii];
    
    var ax = string ? seq1.substr(ii, 1) : seq1[ii];
    var bx = string ? seq2.substr(bj, bj + 1) : seq2[bj];

    if(b_line == null) {
      if(ax != null) {
        event = new Difference.LCS.ContextChange('-', ii, ax, bj, bx);
        if(block != null) event = block(event);
        callbacks.discard_a(event);
      }
    } else {
      while(bj < b_line) {
        bx = string ? seq2.substr(bj, 1) : seq2[bj];
        event = new Difference.LCS.ContextChange('+', ii, ax, bj, bx);
        if(block != null) event = block(event);
        callbacks.discard_b(event);
        bj = bj + 1;
      }
      
      bx = string ? seq2.substr(bj, 1) : seq2[bj];
      event = new Difference.LCS.ContextChange('=', ii, ax, bj, bx);
      if(block != null) event = block(event);
      callbacks.match(event);
      bj = bj + 1;
    }
    
    // Update the ai with the current index point
    ai = ii;    
  }
  
  // Update pointer
  ai = ai + 1;
  
  // The last entry (if any) processed was a match. +ai+ and +bj+ point
  // just past the last matching lines in their sequences.
  while(ai < a_size || bj < b_size) {
    // last A
    if(ai == a_size && bj < b_size) {
      if(callbacks.finished_a != null && !run_finished_a) {
        ax = string ? seq1.substr(seq1.length - 1, 1) : seq1[seq1.length - 1];
        bx = string ? seq2.substr(bj, 1) : seq2[bj];
        event = new Difference.LCS.ContextChange('>', (a_size - 1), ax, bj, bx);
        if(block != null) event = block(event);
        callbacks.finished_a(event);
        run_finished_a = true;
      } else {        
        ax = string ? seq1.substr(ai, 1) : seq1[ai];
        do {
          bx = string ? seq2.substr(bj, 1) : seq2[bj];
          event = new Difference.LCS.ContextChange('+', ai, ax, bj, bx);
          if(block != null) event = block(event);
          callbacks.discard_b(event);
          bj = bj + 1;          
        } while(bj < b_size)
      }
    }
    
    // last B?
    if(bj == b_size && ai < a_size) {
      if(callbacks.finished_b != null && !run_finished_b) {
        ax = string ? seq1.substr(ai, 1) : seq1[ai];
        bx = string ? seq2.substr(seq2.length - 1, 1) : seq2[seq2.length - 1];
        event = new Difference.LCS.ContextChange('<', ai, ax, (b_size -1), bx);
        if(block != null) event = block(event);
        callbacks.finished_b(event);
        run_finished_b = true;
      } else {
        bx = string ? seq2.substr(bj, 1) : seq2[bj];
        do {
          ax = string ? seq1.substr(ai, 1) : seq1[ai];
          event = new Difference.LCS.ContextChange('-', ai, ax, bj, bx);
          if(block != null) event = block(event);
          callbacks.discard_a(event);
          ai = ai + 1;        
        } while(bj < b_size)
      }
    }    
    
    if(ai < a_size) {
      ax = string ? seq1.substr(ai, 1) : seq1[ai];
      bx = string ? seq2.substr(bj, 1) : seq2[bj];
      event = new Difference.LCS.ContextChange('-', ai, ax, bj, bx);
      if(block != null) event = block(event);
      callbacks.discard_a(event);
      ai = ai + 1;
    }

    if(bj < b_size) {
      ax = string ? seq1.substr(ai, 1) : seq1[ai];
      bx = string ? seq2.substr(bj, 1) : seq2[bj];
      event = new Difference.LCS.ContextChange('+', ai, ax, bj, bx);
      if(block != null) event = block(event);
      callbacks.discard_b(event);
      bj = bj + 1;
    }      
  }  
}

// Given two sequenced Enumerables, LCS returns an Array containing their
// longest common subsequences.
// 
//   lcs = Diff::LCS.LCS(seq1, seq2)
// 
// This array whose contents is such that:
// 
//   lcs.each_with_index do |ee, ii|
//     assert(ee.nil? || (seq1[ii] == seq2[ee]))
//   end
// 
// If a block is provided, the matching subsequences will be yielded from
// +seq1+ in turn and may be modified before they are placed into the
// returned Array of subsequences.
Difference.LCS.LCS = function(seq1, seq2, block) {
  var matches = Difference.LCS.__lcs(seq1, seq2);
  var ret = [];
  
  for(var ii = 0; ii < matches.length; ii++) {
    if(matches[ii] != null) {
      if(block != null) {
        ret.push(block(seq1[ii]));
      } else {
        ret.push(seq1[ii]);
      }
    }
  }
  // Return the result
  return ret;
}

// Compute the longest common subsequence between the arrays a and b the result
// being an array whose content is such that they 
// count = 0
// result.forEach(function(e) {
//  if(e) a[count] == b[e];
//  count++; 
// })
Difference.LCS.__lcs = function(a, b) {
  var a_start = 0;
  var b_start = 0;
  var a_finish = a.length - 1;
  var b_finish = b.length - 1;
  var vector = [];
    
  // Remove common elements at the beginning
  while((a_start <= a_finish) && (b_start <= b_finish) && (a[a_start] == b[b_start])) {
    vector[a_start] = b_start;
    a_start = a_start + 1;
    b_start = b_start + 1;
  }
  
  // Remove common elements at the end
  while((a_start <= a_finish) && (b_start <= b_finish) && (a[a_finish] == b[b_finish])) {
    vector[a_finish] = b_finish;
    a_finish = a_finish - 1;
    b_finish = b_finish - 1;
  }
  
  // Now compute the equivalent classes of positions of elements
  var b_matches = Difference.LCS.__position_hash(b, b_start, b_finish);
  
  // Define treshold and links
  var thresh = [];
  var links = [];
  
  for(var ii = a_start; ii <= a_finish; ii++) {
    var ai = Array.isArray(a) ? a[ii] : a.charAt(ii);
    var bm = b_matches[ai];
    bm = bm ? bm : [];
    var kk = null;
    
    bm.reverse().forEach(function(jj) {
      if(kk != null && (thresh[kk] > jj) && (thresh[kk - 1] < jj)) {
        thresh[kk] = jj;
      } else {
        kk = Difference.LCS.__replace_next_larger(thresh, jj, kk);
      }
      // Add link
      if(kk != null) links[kk] = [(kk > 0) ? links[kk - 1] : null, ii, jj];
    });
  }
  
  // Preinitialize the vector array so we get the nulls at the right points
  for(var i = 0; i < (a_finish - a_start - 1); i++) {
    vector[i] = null;
  }
  
  // Build the vector
  if(thresh.length > 0) {
    var link = links[thresh.length - 1];
    
    while(link != null) {
      vector[link[1]] = link[2];
      link = link[0];
    }
  }
  
  // Return the vector of the longest commong subsequence
  return vector;
}

// Find the place at which +value+ would normally be inserted into the
// Enumerable. If that place is already occupied by +value+, do nothing
// and return +nil+. If the place does not exist (i.e., it is off the end
// of the Enumerable), add it to the end. Otherwise, replace the element
// at that point with +value+. It is assumed that the Enumerable's values
// are numeric.
//
// This operation preserves the sort order.
Difference.LCS.__replace_next_larger = function(enumerable, value, last_index) {
  // Is it off the end
  if(enumerable.length == 0 || (value > enumerable[enumerable.length - 1])) {
    enumerable.push(value);
    return enumerable.length - 1;
  }
  
  // Binary search for the insertion point
  var last_index = last_index || enumerable.length;
  var first_index = 0;
  
  while(first_index <= last_index) {
    var ii = (first_index + last_index) >> 1;
    var found = enumerable[ii];
    
    if(value == found) {
      return null;
    } else if(value > found) {
      first_index = ii + 1;
    } else {
      last_index = ii - 1;
    }
  }
  
  // The insertion point is in first_index; overwrite the next larger
  // value.
  enumerable[first_index] = value;
  return first_index;
}

Difference.LCS.__position_hash = function(enumerable, interval_start, interval_end) {
  interval_start = interval_start ? interval_start : 0;
  interval_end = interval_end ? interval_end : -1;
  
  var hash = {}
  for(var i = interval_start; i <= interval_end; i++) {
    var kk = Array.isArray(enumerable) ? enumerable[i] : enumerable.charAt(i);
    hash[kk] = Array.isArray(hash[kk]) ? hash[kk] : [];
    hash[kk].push(i);
  }
  return hash;
}