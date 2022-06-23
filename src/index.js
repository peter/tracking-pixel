const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const { MongoClient } = require('mongodb');

const port = 3000
const app = express()

app.use(cors())
app.use(cookieParser())

const LOG_LEVEL = process.env.LOG_LEVEL || 'info'
const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/tracking-pixel'

const PIXEL_IMAGE = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')

const TEST_DATA = [
  { timestamp: new Date('2013-09-01 09:00:00'), url: '/contact.html', userId: 12345 },
  { timestamp: new Date('2013-09-01 09:00:00'), url: '/contact.html', userId: 12346  },
  { timestamp: new Date('2013-09-01 10:00:00'), url: '/contact.html', userId: 12345  },
  { timestamp: new Date('2013-09-01 10:01:00'), url: '/about.html', userId: 12347  },
  { timestamp: new Date('2013-09-01 11:00:00'), url: '/contact.html', userId: 12347  },
]

function log(message, data = {}) {
  const LOG_LEVELS = ['debug', 'info', 'warning', 'error'];
  const level = data.level || 'info';
  if (!LOG_LEVELS.includes(level)) throw new Error(`invalid log level: ${level}`);
  if (LOG_LEVELS.indexOf(level) < LOG_LEVELS.indexOf(LOG_LEVEL)) return;
  const timestamp = new Date().toISOString();
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

app.get('/tracking', (req, res) => {
  log('tracking request', { referer: req.get('Referer'), cookies: req.cookies })
  const cookieValue = new Date().toISOString()
  res.cookie('_track', cookieValue, { maxAge: (1000 * 60 * 24 * 30), httpOnly: true });
  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': PIXEL_IMAGE.length
  })
  res.end(PIXEL_IMAGE)
})

async function startServer() {
  const client = new MongoClient(MONGO_URL)
  log('connecting to database...', { MONGO_URL })
  await client.connect()
  const db = client.db()

  // for (const trackingEvent of TEST_DATA) {
  //   log('creating test data', { trackingEvent })
  //   await db.collection('trackingEvents').insertOne(trackingEvent)
  // }

  const result = await db.collection('trackingEvents').aggregate([
    // { $match: {} }, // TODO: date range
    { $group: { _id: { timestamp: '$timestamp', url: '$url' }, pageViews: { $sum: 1 } } },
  ], { allowDiskUse: true }).toArray()
  // const result = await db.collection('trackingEvents').find({}).toArray()
  log('query result', { result })

  app.listen(port, () => {
    console.log(`tracking-pixel app listening on port ${port}`)
  })
}

startServer()
