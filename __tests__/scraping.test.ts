import ScrapeTA from '../src'
import { createServer, Server } from 'http'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Scrape-them-all', () => {
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

  test('scrape by simply storing redirects in cookies', async () => {
    const { response, data } = await ScrapeTA(
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

  test('scrape with custom headers to get data modified by AJAX', async () => {
    const { response, data } = await ScrapeTA(
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
          access: (x) => x.eq(0).text()
        }
      }
    )
    expect(response.ok).toBe(true)
    expect(data).toEqual({
      effect: '120 Chance'
    })
  })

  test('scrape basic data', async () => {
    const { response, data } = await ScrapeTA(`http://localhost:${port}`, {
      title: {
        selector: 'h1.title'
      },
      description: {
        selector: '.description'
      },
      date: {
        selector: '.date',
        transform: (x) => new Date(x)
      }
    })
    expect(response.ok).toBe(true)
    expect(data).toEqual({
      title: 'Title',
      description: 'Lorem ipsum',
      date: new Date('1988-01-01')
    })
  })

  test('scrape list', async () => {
    const { response, data } = await ScrapeTA(`http://localhost:${port}`, {
      features: {
        selector: '.features',
        listModel: {
          selector: 'li'
        }
      }
    })
    expect(response.ok).toBe(true)
    expect(data).toEqual({
      features: ['1', '2', '3', '4', '5', '6']
    })
  })

  test('scrape and transform list', async () => {
    const { response, data } = await ScrapeTA(`http://localhost:${port}`, {
      features: {
        selector: '.features',
        listModel: {
          selector: 'li',
          transform: (x) => parseInt(x, 10)
        }
      }
    })
    expect(response.ok).toBe(true)
    expect(data).toEqual({
      features: [1, 2, 3, 4, 5, 6]
    })
  })

  test('scrape nested object', async () => {
    const { response, data } = await ScrapeTA(`http://localhost:${port}`, {
      nested: {
        selector: '.nested',
        foo: {
          level1: {
            selector: '.level1',
            level2: {
              selector: 'span',
              access: (x) => x.eq(1).text()
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
    })
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

  test('scrape closest', async () => {
    const { response, data } = await ScrapeTA(`http://localhost:${port}`, {
      addresses: {
        selector: 'table tbody tr',
        listModel: {
          address: '.address',
          city: {
            selector: '',
            access: (x) => x.closest('table').find('thead .city').text()
          }
        }
      }
    })
    expect(response.ok).toBe(true)
    expect(data).toEqual({
      addresses: [
        { address: 'one way street', city: 'Sydney' },
        { address: 'GT Road', city: 'Sydney' }
      ]
    })
  })
})
