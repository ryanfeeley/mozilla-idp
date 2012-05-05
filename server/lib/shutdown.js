/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* shutdown is a tiny abstraction of a handler that can be
 * used to shutdown gracefully upon signals
 */

const logger = require("./logging.js").logger;

const MAX_WAIT_MS = 10000;
const MAX_NICE_END_MS = 5000;

function connectionListener(app) {
  var connections = [];
  console.log('connectionListener called');
  app.on('connection', function(c) {
    console.log('connection');
    connections.push(c);
    c.on('close', function() {
      var where = connections.indexOf(c);
      if (where >= 0) connections.splice(where, 1);
    });
  });

  return function(callback) {
    console.log('connlist callback ');
    if (!callback) callback = function(cli) { cli(); };
console.log('setting timeouts');
    var total_timeout = setTimeout(function() {
      logger.warn(MAX_WAIT_MS + "ms exceeded, going down forcefully...");
      setTimeout(function() { process.exit(1); }, 0);
    }, MAX_WAIT_MS);

    var nice_timeout = setTimeout(function() {
      logger.warn("forcefully closing " + connections.length + " remaining connections...");
      connections.forEach(function(c) { c.destroy() });
    }, MAX_NICE_END_MS);
    console.log('tmeouts set ');

    app.on('close', function() {
      console.log('on close called ');
      function clearTimeoutsAndCallClient() {
        clearTimeout(nice_timeout);
        clearTimeout(total_timeout);
        callback(function() {
          logger.info("graceful shutdown complete...");
        });
        }

        console.log(connections.length);
      // if there aren't any open connections, we're done!
      if (connections.length === 0) clearTimeoutsAndCallClient();

      connections.forEach(function(c) {
        c.on('close', function() {
          if (!app.connections && connections.length === 0) {
            // once all connections are shutdown, let's call the client
            // to let him shutdown all his open connections
            clearTimeoutsAndCallClient();
          }
        });
        c.end();
      });
    });
    console.log('calling close ');
    app.close();
  }
};

exports.handleTerminationSignals = function(app, callback) {
  var gotSignal = false;
  var terminate = connectionListener(app);
  function endIt(signame) {
    console.log('Hooking up signal ' + signame);
    return function() {
      console.log('Got signal ');
      console.log('gotSignal=' + gotSignal);
      if (gotSignal) return;
      gotSignal = true;
      logger.warn("SIG" + signame + " received.  closing " + app.connections + " connections and shutting down.");
      terminate(callback);
    };
  }
  console.log('Hooking up process on');
  process.on('SIGINT', endIt('INT')).on('SIGTERM', endIt('TERM')).on('SIGQUIT', endIt('QUIT'));
};
