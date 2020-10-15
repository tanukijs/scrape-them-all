import http from 'http'
import { ScrapeTA } from '../src/index'

describe('Scrape-them-all', () => {
  let server: http.Server
  beforeAll(() => {
    server = http
      .createServer((_req, res) => {
        res.write('public/index.html')
      })
      .listen(8080, 'localhost')
    console.log('Node server running on port 3000')
  })

  test('scrape simple data', async () => {
    const data = await ScrapeTA('http://localhost:8080', {
      title: 'h1.title',
      description: '.description',
      date: {
        selector: '.date',
        transformer: (x) => new Date(x)
      }
    })
    expect(data).toEqual({
      title: 'Title',
      description: 'Lorem ipsum',
      date: new Date('1988-01-01')
    })
  })
  test('scrape lists', async () => {
    const data = await ScrapeTA('http://localhost:3000', {
      features: {
        isListItem: true,
        selector: '.features > li'
      }
    })
    expect(data).toEqual({
      features: ['1', '2', '3', '4', '5', '6']
    })
  })
  test('scrape and transform lists', async () => {
    const data = await ScrapeTA('http://localhost:3000', {
      features: {
        isListItem: true,
        selector: '.features > li',
        transformer: (x) => parseInt(x, 10)
      }
    })
    expect(data).toEqual({
      features: ['1', '2', '3', '4', '5', '6']
    })
  })
  test('scrape nested objects', async () => {
    const data = await ScrapeTA('http://localhost:3000', {
      nested: {
        selector: '.nested',
        dataModel: {
          foo: {
            dataModel: {
              level1: {
                selector: '.level1',
                dataModel: {
                  level2: {
                    selector: 'span',
                    accessor: (x) => x.eq(1)
                  }
                }
              },
              level1Text: 'span',
              level2Text: '.level2'
            }
          }
        }
      }
    })
    expect(data).toEqual({
      nested: {
        foo: {
          level1: {
            level2: '2'
          },
          level2Text: '2',
          level1Text: 'Foo12'
        }
      }
    })
  })
  test('scrape and transform lists', async () => {
    const data = await ScrapeTA('http://localhost:3000', {
      addresses: {
        selector: 'table tbody tr',
        isListItem: true,
        dataModel: {
          address: '.address',
          suburb: {
            accessor: (x) => x.closest('table').find('thead .city').text()
          }
        }
      }
    })
    expect(data).toEqual({
      features: ['1', '2', '3', '4', '5', '6']
    })
  })

  afterAll((done) => {
    server.close(done)
  })
})
