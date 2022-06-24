# Tracking Pixel API

A minimal implementation of a Node.js tracking pixel API with a MongoDB database. This API is not production ready, it's for learning purposes only.

## TODO

* CLI
  MongoDB aggregations
* Unit tests
* End-to-end tests
* TypeScript?
* What are the interesting considerations in this app?

## Developer Setup

Use correct Node versiona and install packages:

```sh
nvm use
npm install
```

To run with the in-memory database [mongodb-memory-server](https://github.com/nodkz/mongodb-memory-server):

```sh
MONGODB_MEMORY_SERVER=true npm run dev
```

If you have [MongoDB installed](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-os-x/) you can use that instead (the env var `MONGO_URL` defaults to `mongodb://127.0.0.1:27017/tracking-pixel`):

```sh
MONGODB_MEMORY_SERVER=false npm run dev
```

For local development you can keep environment variables in `.env`:

```sh
cp .env.example .env
```

Getting the tracking pixel from the command line (with/without cookie):

```sh
# First visit without cookie:
curl -i -o - -H 'Referer: http://localhost:8080/test/page1.html' http://localhost:3000/track
# Set-Cookie: _track=8b93316c-5b1b-4a05-9603-115ea81fb330; Max-Age=43200; Path=/; Expires=Fri, 24 Jun 2022 20:36:35 GMT; HttpOnly

# Repeat visit with cookie:
curl -i -o - -H 'Referer: http://localhost:8080/test/page1.html' --cookie "_track=8b93316c-5b1b-4a05-9603-115ea81fb330" -o /dev/null http://localhost:3000/track
```

Test HTML page:

```sh
npm run dev-static
open http://localhost:8080/test/page1.html
```

Show tracking events in the database (development feature only):

```sh
curl http://localhost:3000/trackingEvents | jq .
```

Checking tracking events directly in the database (requires installed MongoDB):

```sh
npm run dev-db
db.trackingEvents.find().sort({ timestamp: -1 }).pretty()
```

## Resources

* [New referrer policy for Chrome](https://developer.chrome.com/blog/referrer-policy-new-chrome-default/#:~:text=%23%20What%20does%20this%20change%20mean,the%20path%20and%20query%20string.)
* [How to set referrer policy in HTML](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy#integration_with_html)
* [How to restrict access to cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrict_access_to_cookies)
* [HTTP Referer header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referer)
