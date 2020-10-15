import { ScrapeTA } from '../src'
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
    server.close()
    done()
  })

  test('scrape simple data', async () => {
    const data = await ScrapeTA(`http://localhost:${port}`, {
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
    const data = await ScrapeTA(`http://localhost:${port}`, {
      features: {
        selector: '.features',
        listModel: 'li'
      }
    })
    expect(data).toEqual({
      features: ['1', '2', '3', '4', '5', '6']
    })
  })

  test('scrape and transform lists', async () => {
    const data = await ScrapeTA(`http://localhost:${port}`, {
      features: {
        selector: '.features',
        listModel: {
          selector: 'li',
          transformer: (x) => parseInt(x, 10)
        }
      }
    })
    expect(data).toEqual({
      features: [1, 2, 3, 4, 5, 6]
    })
  })

  test('scrape nested objects', async () => {
    const data = await ScrapeTA(`http://localhost:${port}`, {
      nested: {
        foo: {
          level1: {
            level2: {
              selector: '.nested .level1 span',
              accessor: (x) => x.eq(1).text()
            }
          },
          level1Text: '.nested span',
          level2Text: '.nested .level2'
        }
      }
    })
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

  test('scrape and transform lists', async () => {
    const data = await ScrapeTA(`http://localhost:${port}`, {
      addresses: {
        selector: 'table tbody tr',
        listModel: {
          address: '.address',
          city: {
            selector: '',
            accessor: (x) => x.closest('table').find('thead .city').text()
          }
        }
      }
    })
    expect(data).toEqual({
      addresses: [
        { address: 'one way street', city: 'Sydney' },
        { address: 'GT Road', city: 'Sydney' }
      ]
    })
  })
})
