# Tracking Pixel API

A minimal implementation of a Node.js tracking pixel API with a MongoDB database. This API is not production ready, it's for learning purposes only.

## TODO

* Unit tests
* End-to-end tests
* CLI and CSV output
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
curl -i -o - -H 'Referer: http://localhost:8080/test/contact.html' http://localhost:3000/track
# Set-Cookie: _track=ce3be6d4-cc1d-4375-89a6-7da37ae5646f; Max-Age=43200; Path=/; Expires=Sat, 25 Jun 2022 02:31:06 GMT; HttpOnly

# Repeat visit with cookie:
curl -i -o - -H 'Referer: http://localhost:8080/test/contact.html' --cookie "_track=ce3be6d4-cc1d-4375-89a6-7da37ae5646f" -o /dev/null http://localhost:3000/track
```

Test HTML page:

```sh
npm run dev-static
open http://localhost:8080/test/about.html
```

Tracking report endpoint:

```sh
# Time range of one day
curl "http://localhost:3000/trackingReport?from=2022-06-24&to=2022-06-25" | jq .
# Time range of one minute
curl "http://localhost:3000/trackingReport?from=2022-06-24T20:16:00.000Z&to=2022-06-24T20:17:00.000Z" | jq .
```

Show listing of recent tracking events in the database (used to expose in-memory database data during development):

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
