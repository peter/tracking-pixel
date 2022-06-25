const { startServer } = require('../../src/index')
const axios = require('axios')
const assert = require('assert')
const { ObjectId } = require("mongodb")
const uuid = require('uuid')
const { get } = require('lodash')

process.env.NODE_ENV = 'test'
process.env.MONGODB_MEMORY_SERVER = 'true'

const PORT = 3001
const BASE_URL = `http://localhost:${PORT}`

function addSeconds(date, seconds) {
  return new Date(date.getTime() + seconds * 1000)
}

// used to make axios not throw on non-success status
const validateStatus = (status) => true

async function basicReportScenarioTest() {
  // Create a few tracking events with a repeat visit and two different pages
  let response
  const trackingRequests = [
    { Referer: 'https://www.example.com/contact.html' },
    { Referer: 'https://www.example.com/contact.html', repeatVisit: true },
    { Referer: 'https://www.example.com/contact.html' },
    { Referer: 'https://www.example.com/about.html' },
    { Referer: 'https://www.example.com/contact.html' },
  ]
  let lastCookie
  for (const { Referer, repeatVisit } of trackingRequests) {
    const headers = { Referer }
    if (repeatVisit) headers.Cookie = lastCookie
    response = await axios.get(`${BASE_URL}/track`, {
      headers,
      validateStatus,
    })
    assert.strictEqual(response.status, 200)
    lastCookie = get(response.headers, 'set-cookie[0]')
    if (!repeatVisit) assert(lastCookie, 'for first time visits a cookie should be set')
    assert.strictEqual(response.headers['content-type'], 'image/gif', 'track endpoint should return gif content type')
  }

  // Check trackingEvents
  response = await axios.get(`${BASE_URL}/trackingEvents`, {
    validateStatus,
  })
  assert.strictEqual(response.status, 200)
  assert.strictEqual(response.data.trackingEvents.length, trackingRequests.length)
  const event = response.data.trackingEvents[0]
  assert(ObjectId.isValid(event._id), 'event should have valid BSON id')
  const timestamp = new Date(Date.parse(event.timestamp))
  assert(timestamp && timestamp < new Date() && timestamp > addSeconds(new Date(), -5000), 'should have valid recent timestamp')
  assert.strictEqual(event.url, '/contact.html')
  assert(uuid.validate(event.userId), 'should have valid UUID userId')

  // Check report
  response = await axios.get(`${BASE_URL}/trackingReport`, {
    params: {
      from: addSeconds(new Date(), -5000),
      to: new Date()
    },
    validateStatus,
  })
  assert.strictEqual(response.status, 200)
  assert.deepStrictEqual(response.data.report, [
    {
      _id: '/about.html',
      pageViews: 1,
      visitors: 1
    },
    {
      _id: '/contact.html',
      pageViews: 4,
      visitors: 3
    },
  ])
}

async function trackValidationTest() {
  let response

  response = await axios.get(`${BASE_URL}/track`, {
    headers: {},
    validateStatus,
  })
  assert.strictEqual(response.status, 400, 'track endpoint should require a Referer')

  response = await axios.get(`${BASE_URL}/track`, {
    headers: { Referer: 'this-referer-is-not-valid' },
    validateStatus,
  })
  assert.strictEqual(response.status, 400, 'track endpoint should validate Referer')
}

async function reportValidationTest() {
  let response

  const validParams = {
    from: addSeconds(new Date(), -5000),
    to: new Date()
  }

  response = await axios.get(`${BASE_URL}/trackingReport`, {
    params: { from: validParams.from },
    validateStatus,
  })
  assert.strictEqual(response.status, 400, 'trackingReport endpoint should require a to query param')

  response = await axios.get(`${BASE_URL}/trackingReport`, {
    params: { ...validParams, from: 'foobar' },
    validateStatus,
  })
  assert.strictEqual(response.status, 400, 'trackingReport endpoint should require a valid from query param')

  response = await axios.get(`${BASE_URL}/trackingReport`, {
    params: { ...validParams, to: 'foobar' },
    validateStatus,
  })
  assert.strictEqual(response.status, 400, 'trackingReport endpoint should require a valid to query param')

  response = await axios.get(`${BASE_URL}/trackingReport`, {
    params: { from: validParams.to, to: validParams.from },
    validateStatus,
  })
  assert.strictEqual(response.status, 400, 'trackingReport endpoint should require valid range with from < to')

  response = await axios.get(`${BASE_URL}/trackingReport`, {
    params: validParams,
    validateStatus,
  })
  assert.strictEqual(response.status, 200, 'trackingReport should accept valid from/to query params')
}

async function main() {
  await startServer(PORT)

  await basicReportScenarioTest()
  await trackValidationTest()
  await reportValidationTest()

  console.log('SUCCESS!')
  process.exit(0)
}

main()
