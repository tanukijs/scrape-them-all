import { request } from 'https'

export default function req(url: string): Promise<cheerio.Element> {
  return new Promise((resolve, reject) => {
    const req = request(url, (res) => {
      let chunks = ''
      res.on('data', (chunk) => (chunks += chunk))
      res.on('error', reject)
      res.on('end', () => resolve(chunks as never))
    })
    req.on('error', reject)
    req.end()
  })
}
