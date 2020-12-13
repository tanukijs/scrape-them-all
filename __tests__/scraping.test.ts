import { scrapeTA } from '../src'
import { createServer, Server } from 'http'
import { readFileSync } from 'fs'
import { join } from 'path'

let server: Server
const port = 8080

beforeAll((done) => {
  server = createServer((_req, res) => {
    const indexPath = join(__dirname, 'public/index.html')
    const indexHTML = readFileSync(indexPath)
    res.write(indexHTML)
    res.end()
  })
  server.listen(port, () => done() && console.log('Server running on port 8080'))
})
afterAll((done) => {
  server.close(() => done())
})

describe('Scrape basic data', () => {
  test('Directly target the HTML element', async () => {
    const { response, data } = await scrapeTA<Record<string, unknown>>(
      `http://localhost:${port}`,
      {
        title: 'h1.title',
        description: '.description',
        date: {
          selector: '.date',
          transformer: (x) => new Date(x)
        }
      }
    )
    expect(response.ok).toBe(true)
    expect(data).toEqual({
      title: 'Title',
      description: 'Lorem ipsum',
      date: new Date('1988-01-01')
    })
  })

  test('Use a reserved keyword', async () => {
    const { response, data } = await scrapeTA<Record<string, unknown>>(
      `http://localhost:${port}`,
      {
        title: 'h1.title',
        _attribute: {
          selector: 'img',
          attribute: 'src'
        }
      }
    )
    expect(response.ok).toBe(true)
    expect(data).toEqual({
      title: 'Title',
      attribute:
        'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/ee/ee276885cdbec23bdb9780509210c3c24dc7070e_full.jpg'
    })
  })
})

describe('Scrape list', () => {
  test('With transform', async () => {
    const { response, data } = await scrapeTA<Record<string, unknown>>(
      `http://localhost:${port}`,
      {
        features: {
          selector: '.features',
          listModel: {
            selector: 'li',
            transformer: (x) => parseInt(x, 10)
          }
        }
      }
    )
    expect(response.ok).toBe(true)
    expect(data).toEqual({
      features: [1, 2, 3, 4, 5, 6]
    })
  })

  test('Without transform', async () => {
    const { response, data } = await scrapeTA<Record<string, unknown>>(
      `http://localhost:${port}`,
      {
        features: {
          selector: '.features',
          listModel: {
            selector: 'li'
          }
        }
      }
    )
    expect(response.ok).toBe(true)
    expect(data).toEqual({
      features: ['1', '2', '3', '4', '5', '6']
    })
  })
})

describe('Scrape nested object', () => {
  test('Object nested with multiple custom keys', async () => {
    const { response, data } = await scrapeTA<Record<string, unknown>>(
      `http://localhost:${port}`,
      {
        nested: {
          selector: '.nested',
          foo: {
            level1: {
              selector: '.level1',
              level2: {
                selector: 'span',
                accessor: (x) => x.eq(1).text()
              }
            },
            level1Text: {
              selector: 'span'
            },
            level2Text: {
              selector: '.level2'
            }
          }
        }
      }
    )
    expect(response.ok).toBe(true)
    expect(data).toEqual({
      nested: {
        foo: {
          level1: {
            level2: '2'
          },
          level1Text: 'Foo12',
          level2Text: '2'
        }
      }
    })
  })

  test('Scrape tables using accessor', async () => {
    const { response, data } = await scrapeTA<Record<string, unknown>>(
      `http://localhost:${port}`,
      {
        addresses: {
          selector: 'table tbody tr',
          listModel: {
            address: '.address',
            city: {
              accessor: (x) => x.closest('table').find('thead .city').text()
            }
          }
        }
      }
    )
    expect(response.ok).toBe(true)
    expect(data).toEqual({
      addresses: [
        { address: 'one way street', city: 'Sydney' },
        { address: 'GT Road', city: 'Sydney' }
      ]
    })
  })
})

describe('Scrape using options', () => {
  test('Store redirections using cookieJar option', async () => {
    const { response, data } = await scrapeTA<Record<string, unknown>>(
      { url: 'http://www.krosmoz.com/en/almanax/2020-01-01', cookieJar: true },
      {
        month: {
          selector: '#almanax_day .day-text'
        }
      }
    )
    expect(response.ok).toBe(true)
    expect(data).toEqual({
      month: 'Javian'
    })
  })

  test('Get data modified by AJAX using headers option', async () => {
    const { response, data } = await scrapeTA<Record<string, unknown>>(
      {
        url:
          'https://www.dofus.com/en/mmorpg/encyclopedia/pets/11950-ankascraper?level=100&_pjax=.ak-item-details-container',
        headers: {
          'x-requested-with': 'XMLHttpRequest',
          'x-pjax': 'true',
          'x-pjax-container': '.ak-item-details-container'
        }
      },
      {
        effect: {
          selector: '.ak-container.ak-content-list.ak-displaymode-col .ak-title',
          accessor: (x) => x.eq(0).text()
        }
      }
    )
    expect(response.ok).toBe(true)
    expect(data).toEqual({
      effect: '120 Chance'
    })
  })
})

describe('Herror handling', () => {
  test('Scrape invalid URL', async () => {
    await expect(
      scrapeTA('http://gertkafgzngegzegerj.com', {
        title: 'h1.title'
      })
    ).rejects.toThrow()
  })

  /*
  test('Use reserved keyword directly', async () => {
    await expect(
      scrapeTA(`http://localhost:${port}`, {
        attribute: 'h1.title'
      })
    ).rejects.toThrow('Root object must be a nested object.')
  })
  */

  test('Use reserved keyword in nested object', async () => {
    await expect(
      scrapeTA(`http://localhost:${port}`, {
        accessor: {
          img: {
            selector: 'img',
            attribute: 'src'
          }
        }
      })
    ).rejects.toThrow(
      'The property "accessor" expects a string or a function. If you want to use "accessor" as a result key, prefix it with an underscore (the first will be stripped automatically).'
    )
  })
})
