const request = require('./request')
const transform = require('./transform')

module.exports = async (url, dataModel) => {
  const target = await request(url)
  return transform(target, dataModel)
}