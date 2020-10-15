import http from 'http'
import { join } from 'path'
import { promisify } from 'util'
import { readFile } from 'fs'
import { ScrapeTA } from '../src/index'
const asyncReadFile = promisify(readFile)

describe('Scrape-them-all', () => {
  let server: http.Server
  beforeAll(async (done) => {
    const indexPath = join(__dirname, 'public/index.html')
    const indexHTML = (await asyncReadFile(indexPath)).toString()

    server = http
      .createServer((_req, res) => {
        res.writeHead(200)
        res.write(indexHTML)
        res.end()
      })
      .listen(8080, () => done && console.log('Node server running on port 8080'))
  })

  afterAll((done) => {
    server.close(done)
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
    const data = await ScrapeTA('http://localhost:8080', {
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
    const data = await ScrapeTA('http://localhost:8080', {
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
    const data = await ScrapeTA('http://localhost:8080', {
      nested: {
        selector: '.nested',
        dataModel: {
          foo: {
            selector: '',
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
    const data = await ScrapeTA('http://localhost:8080', {
      addresses: {
        selector: 'table tbody tr',
        isListItem: true,
        dataModel: {
          address: '.address',
          suburb: {
            selector: '',
            accessor: (x) => x.closest('table').find('thead .city').text()
          }
        }
      }
    })
    expect(data).toEqual({
      features: ['1', '2', '3', '4', '5', '6']
    })
  })
})
