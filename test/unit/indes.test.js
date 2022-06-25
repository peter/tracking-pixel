const { parseReferer } = require('../../src/index')

describe('parseReferer', () => {
  test('it returns path+querystring for valid URL', () => {
    expect(parseReferer('http://www.example.com/foobar.html?id=123')).toEqual('/foobar.html?id=123')
  })

  test('it returns undefined for invalid URL', () => {
    expect(parseReferer('foobar')).toEqual(undefined)
    expect(parseReferer(null)).toEqual(undefined)
    expect(parseReferer(undefined)).toEqual(undefined)
  })
})
