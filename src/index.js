const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const { MongoClient } = require('mongodb');
const uuid = require('uuid')
const { get } = require('lodash');

const port = 3000
const app = express()
let db

app.use(cors())
app.use(cookieParser())

const LOG_LEVEL = process.env.LOG_LEVEL || 'info'
const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/tracking-pixel'

const COOKIE_NAME = '_track'
const PIXEL_IMAGE_BASE64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
const COLLECTION_NAME = 'trackingEvents'

function log(message, data = {}) {
  const LOG_LEVELS = ['debug', 'info', 'warning', 'error'];
  const level = data.level || 'info';
  if (!LOG_LEVELS.includes(level)) throw new Error(`invalid log level: ${level}`);
  if (LOG_LEVELS.indexOf(level) < LOG_LEVELS.indexOf(LOG_LEVEL)) return;
  const timestamp = (data.timestamp || new Date()).toISOString();
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      timestamp,
      message,
      ...data,
      level,
    })
  );
}

function logDebug(message, data = {}) {
  log(message, { ...data, level: 'debug' })
}

function logError(message, data = {}) {
  log(message, { ...data, level: 'error' })
}

function parseReferer(urlString) {
  if (!urlString) return undefined
  try {
    const url = new URL(urlString)
    return `${url.pathname}${url.search}`
  } catch (err) {
    logError('error thrown parsing referer', { urlString, error: err.stack })
    // TODO: can we ever get a valid Referer that fails to parse?
    return undefined
  }
}

function sendValidationError(res, message, debugInfo = {}) {
  log(message, debugInfo);
  const error = { message, ...debugInfo }
  res.status(400);
  res.json({ errors: [error] })
}

app.get('/track', async (req, res) => {
  // Get referer and cookie and log request
  const timestamp = new Date()
  const referer = req.get('Referer')
  const url = parseReferer(referer)
  if (!url) {
    const errorMessage = 'missing or invalid referer url'
    logError(errorMessage, { url, referer })
    res.status(400);
    res.end(errorMessage)
    return
  }
  const requestUserId = get(req.cookies, COOKIE_NAME)
  const userId = requestUserId || uuid.v4()
  const firstRequest = !requestUserId
  log('tracking request', { timestamp, url, userId, firstRequest })

  // Save request in database
  try {
    await db.collection(COLLECTION_NAME).insertOne({ timestamp, url, userId })
  } catch (err) {
    const errorMessage = 'error thrown saving to db'
    logError(errorMessage, { timestamp, url, userId });
    res.status(500);
    res.end(errorMessage)
  }

  // Set cookie in response if not already set
  if (!requestUserId) {
    res.cookie(COOKIE_NAME, userId, {
      maxAge: (1000 * 60 * 24 * 30), // 30 days
      httpOnly: true // not accessible by JavaScript
    });
  }

  // Send response
  const pixelImage = Buffer.from(PIXEL_IMAGE_BASE64, 'base64')
  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': pixelImage.length
  })
  res.end(pixelImage)
})

if (process.env.NODE_ENV !== 'production') {
  app.get('/trackingEvents', async (req, res) => {
    const query = {}
    const options = { sort: { timestamp: -1 }, limit: 100 }
    const trackingEvents = await db.collection('trackingEvents').find(query, options).toArray()
    res.json({ trackingEvents })
  })
}

app.get('/trackingReport', async (req, res) => {
  // Parse date range
  const timeRangeKeys = ['from', 'to']
  const timeRange = {}
  for (const key of timeRangeKeys) {
    const dateString = req.query[key]
    const dateNumber = Date.parse(dateString) // an invalid date will yield NaN which is falsy
    if (!dateNumber) {
      sendValidationError(res, `missing or invalid time range query param`, { key, value: dateString })
      return
    }
    timeRange[key] = new Date(dateNumber)
  }
  if (timeRange.from >= timeRange.to) {
    sendValidationError(res, 'invalid time range - from needs to be less than to', { timeRange })
    return
  }

  // Execute database query
  // See: https://stackoverflow.com/questions/24761266/select-group-by-count-and-distinct-count-in-same-mongodb-query
  const options = { allowDiskUse: true }
  const pipeline = [
    { $match: { timestamp: { $gt: timeRange.from, $lt: timeRange.to } } },
    { $group: {
      _id: { url: '$url', userId: '$userId' },
      count: { $sum: 1 }
    }},
    { $group: {
      _id: '$_id.url',
      pageViews: { $sum: '$count' },
      visitors: { $sum: 1 },
    }},
  ]
  log('generating tracking report', { pipeline })
  const report = await db.collection(COLLECTION_NAME).aggregate(pipeline, options).toArray()

  // Send response
  res.json({ timeRange, report })
})

async function startServer() {
  let mongoUrl = MONGO_URL
  if (process.env.MONGODB_MEMORY_SERVER === 'true') {
    const { MongoMemoryServer } = require('mongodb-memory-server')
    log('starting mongodb-memory-server')
    const mongod = await MongoMemoryServer.create();
    mongoUrl = mongod.getUri();
  }
  const client = new MongoClient(mongoUrl)
  log('connecting to database', { mongoUrl })
  await client.connect()
  db = client.db()

  app.listen(port, () => {
    console.log(`tracking-pixel app listening on port ${port}`)
  })
}

startServer()
