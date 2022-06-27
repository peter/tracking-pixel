# Tracking Pixel API

A minimal implementation of a Node.js tracking pixel API backed by a MongoDB database. This API is not production ready and is for learning purposes only.

## Developer Setup

Use correct Node version (see `.nvmrc`) and install packages:

```sh
nvm use
# Check you have the node version specified in .nvmrc
node --version

npm install
```

Run with the in-memory database [mongodb-memory-server](https://github.com/nodkz/mongodb-memory-server):

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

## Testing

There are unit tests (`test:unit`) and integration tests (`test:integration`) and `npm test` will run both of them:

```sh
npm test
```

The integration tests will start the server with the `mongodb-memory-server` and make various HTTP requests against the API.

## The Track Endpoint

The track endpoint will read the `url` from the `Referer` header and the `userId` from the `_track` cookie (if the cookie is not present then a `Set-Cookie` response header is issued) and store the request in the MongoDB database.

```sh
# First visit without cookie:
curl -i -o - -H 'Referer: http://localhost:8080/test/contact.html' http://localhost:3000/track
# Set-Cookie: _track=ce3be6d4-cc1d-4375-89a6-7da37ae5646f; Max-Age=43200; Path=/; Expires=Sat, 25 Jun 2022 02:31:06 GMT; HttpOnly

# Repeat visit with cookie:
curl -i -o - -H 'Referer: http://localhost:8080/test/contact.html' --cookie "_track=ce3be6d4-cc1d-4375-89a6-7da37ae5646f" -o /dev/null http://localhost:3000/track
```

## The Tracking Report Endpoint

The `/trackingReport` endpoint gives you number of `pageViews` and `visitors` by `url` for a given time range. The result is sorted by `pageViews` in descending order with a limit of a 100 items.

```sh
# Time range of one day
curl "http://localhost:3000/trackingReport?from=2022-06-24&to=2022-06-25" | jq .

# Time range of one minute
curl "http://localhost:3000/trackingReport?from=2022-06-24T20:16:00.000Z&to=2022-06-24T20:17:00.000Z" | jq .
```

## Tracking Report CLI

There is a CLI script (built with the `Commander` package) you can use to get a CSV report from the `/trackingReport` endpoint (`--baseUrl` defaults to `http://localhost:3000`):

```sh
# Show usage
./cli trackingReport --help

# Get report from local server
./cli trackingReport --from 2022-06-26 --to 2022-06-27

# Get report from production server
./cli trackingReport --from 2022-06-26 --to 2022-06-27 --baseUrl https://url.of.production.tracking.api
```

## Viewing In-Memory Database Data in Development

Show listing of recent tracking events in the database (intended for development only):

```sh
curl http://localhost:3000/trackingEvents | jq .
```

## Test HTML Pages

There are two example HTML pages for local testing (requires having the server running with `npm run dev`):

```sh
npm run dev-static
open http://localhost:8081/test/about.html
```

## Viewing Database Data with the MongoDB Console

You can check tracking events directly in the database (requires installed MongoDB):

```sh
npm run dev-db
db.trackingEvents.find().sort({ timestamp: -1 }).pretty()
```

## Resources

* [New referrer policy for Chrome](https://developer.chrome.com/blog/referrer-policy-new-chrome-default/#:~:text=%23%20What%20does%20this%20change%20mean,the%20path%20and%20query%20string.)
* [How to set referrer policy in HTML](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy#integration_with_html)
* [How to restrict access to cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrict_access_to_cookies)
* [HTTP Referer header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referer)
