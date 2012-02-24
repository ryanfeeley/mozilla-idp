(function () {
// username@mozilla.com
window.provision = function (user) {
  var cmpi = function (s1, s2) {
        if (! s1.toLowerCase) s1 = String(s1);
        if (! s2.toLowerCase) s2 = String(s2);
        return s1.toLowerCase() == s2.toLowerCase();
      },
      fail = navigator.id.raiseProvisioningFailure,
      msg = "user is not authenticated as target user";
  console.log('CLIENT hooking up begin provisioning with user=', user);

  // username@dev.clortho.mozilla.org
  navigator.id.beginProvisioning(function(email, cert_duration) {
    console.log('CLIENT callback');
    console.log('CLIENT begining provisioning', email, cert_duration);
    //var n_email = email.replace('dev.clortho.mozilla.org', 'mozilla.com');
    if (! user) {
      console.log('CLIENT no session, failing');
      console.log('CLIENT', navigator.id.raiseProvisioningFailure);
      //navigator.id.raiseProvisioningFailure(msg);
      fail(msg);
    } else {
      if (cmpi(user, email)) {
      console.log('CLIENT emails matched ' + user + ' ' +
                  email + ' next genKeyPair');
        navigator.id.genKeyPair(function(pubkey) {
          $.ajax({
            url: '/browserid/provision',
            data: JSON.stringify({
              pubkey: pubkey,
              duration: cert_duration
            }),
            type: 'POST',
            headers: { "Content-Type": 'application/json' },
            dataType: 'json',
            success: function(r) {
              console.log("CLIENT We successfully authed, registering cert " + r.cert);
              // all done!  woo!
              navigator.id.registerCertificate(r.cert);
            },
            error: function(r) {
              console.log("CLIENT Error certifying key, raising provision failure");
              navigator.id.raiseProvisioningFailure(msg);
            }
          });
        });
      } else {        
        console.log('CLIENT user/email didn\'t match ' + user + ' ' + email);
        navigator.id.raiseProvisioningFailure(msg);
      }    
    }
  }); //beginProvisioning
};
console.log('CLIENT window.provision=', window.provision);
})();