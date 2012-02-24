# Developer Notes #

Running Clortho without a web server...

This service **must** run on port 443. This is baked into the BrowserID Primary Protocol.

    cd etc
    openssl genrsa -out privatekey.pem 1024 
    openssl req -new -key privatekey.pem -out certrequest.csr 
    openssl x509 -req -in certrequest.csr -signkey privatekey.pem -out certificate.pem


## Configure public key

    mkdir client/.well-known
    curl -k https://vinz.clortho.org/make/.well-known/browserid > client/.well-known/browserid

## Configure LDAP

You must use your exact LDAP email, not an alias. This is your original 
Mozilla issued email address.