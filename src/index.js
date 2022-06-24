const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const { MongoClient } = require('mongodb');
const uuid = require('uuid')
const { get } = require('lodash')

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

function logError(message, data = {}) {
  log(message, { ...data, level: 'error' })
}

app.get('/tracking', (req, res) => {
  const timestamp = new Date()
  const url = req.get('Referer')
  const requestUserId = get(req.cookies, COOKIE_NAME)
  const userId = requestUserId || uuid.v4()
  const firstRequest = !requestUserId
  log('tracking request', { timestamp, url, userId, firstRequest })

  // Save request in database
  try {
    db.collection(COLLECTION_NAME).insertOne({ timestamp, url, userId })
  } catch (err) {
    logError('error thrown saving to db', { timestamp, url, userId });
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

async function startServer() {
  const client = new MongoClient(MONGO_URL)
  log('connecting to database...', { MONGO_URL })
  await client.connect()
  db = client.db()

  // const TEST_DATA = [
  //   { timestamp: new Date('2013-09-01 09:00:00'), url: '/contact.html', userId: 12345 },
  //   { timestamp: new Date('2013-09-01 09:00:00'), url: '/contact.html', userId: 12346  },
  //   { timestamp: new Date('2013-09-01 10:00:00'), url: '/contact.html', userId: 12345  },
  //   { timestamp: new Date('2013-09-01 10:01:00'), url: '/about.html', userId: 12347  },
  //   { timestamp: new Date('2013-09-01 11:00:00'), url: '/contact.html', userId: 12347  },
  // ]
  // for (const trackingEvent of TEST_DATA) {
  //   log('creating test data', { trackingEvent })
  //   await db.collection('trackingEvents').insertOne(trackingEvent)
  // }
  // const result = await db.collection('trackingEvents').aggregate([
  //   // { $match: {} }, // TODO: date range
  //   { $group: { _id: { timestamp: '$timestamp', url: '$url' }, pageViews: { $sum: 1 } } },
  // ], { allowDiskUse: true }).toArray()
  // // const result = await db.collection('trackingEvents').find({}).toArray()
  // log('query result', { result })

  app.listen(port, () => {
    console.log(`tracking-pixel app listening on port ${port}`)
  })
}

startServer()
