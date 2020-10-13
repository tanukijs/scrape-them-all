const https = require('https')

module.exports = url => {
  return new Promise((resolve, reject) => {
    const req = https.request(url, res => {
      let chunks = ''
      res.on('data', chunk => chunks += chunk)
      res.on('error', reject)
      res.on('end', () => resolve(chunks))
    })
    req.on('error', reject)
    req.end()
  })
}