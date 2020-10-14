import { request, RequestOptions } from 'https'

export default function req(query: string | URL | RequestOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = request(query, (res) => {
      let chunks = ''
      res.on('data', (chunk) => (chunks += chunk))
      res.on('error', reject)
      res.on('end', () => resolve(chunks))
    })
    req.on('error', reject)
    req.end()
  })
}
