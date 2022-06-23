# tracking-pixel

## TODO

* Add tracking pixel route
* CORS headers?
* MongoDB aggregations
* Referrer
  https://developer.chrome.com/blog/referrer-policy-new-chrome-default/#:~:text=%23%20What%20does%20this%20change%20mean,the%20path%20and%20query%20string.
  https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy#integration_with_html
* Get/set cookie
  https://stackoverflow.com/questions/16209145/how-can-i-set-cookie-in-node-js-using-express-framework
  Set-Cookie: _track=2022-06-22T19%3A16%3A16.816Z; Max-Age=43200; Path=/; Expires=Thu, 23 Jun 2022 07:16:16 GMT; HttpOnly
* Log requests
* CLI
* Unit tests
* Test HTML pages?
* TypeScript?
* What are the interesting considerations in this app?

## Developer Setup

You need to have [MongoDB installed](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-os-x/) or set the `MONGO_URL` env variable to connect to a hosted MongoDB service to run this app.

```sh
npm install
npm run dev

curl -i http://localhost:3000/tracking
```

Test HTML page:

```sh
npm run dev-static
open http://localhost:8080/test/page1.html
```
