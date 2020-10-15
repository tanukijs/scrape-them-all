import { ScrapeTA } from '../src'
import { createServer, Server } from 'http'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Scrape-them-all', () => {
  let server: Server

  beforeAll((done) => {
    server = createServer((_req, res) => {
      const indexPath = join(__dirname, 'public/index.html')
      const indexHTML = readFileSync(indexPath)
      res.write(indexHTML)
      res.end()
    })
    server.listen(8080, () => done() && console.log('Server running on port 8080'))
  })

  afterAll((done) => {
    server.close()
    done()
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
        selector: '.features',
        listModel: 'li'
      }
    })
    expect(data).toEqual({
      features: ['1', '2', '3', '4', '5', '6']
    })
  })

  test('scrape and transform lists', async () => {
    const data = await ScrapeTA('http://localhost:8080', {
      features: {
        selector: '.features',
        listModel: 'li',
        transformer: (x) => parseInt(x, 10)
      }
    })
    expect(data).toEqual({
      features: ['1', '2', '3', '4', '5', '6']
    })
  })
})
