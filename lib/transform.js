const cheerio = require('cheerio')

/**
 * @typedef {object} TransformRules
 * @property {string|null} selector
 * @property {boolean} isListItem
 * @property {boolean} isTrimmed
 * @property {string} attribute
 * @property {function} transformer
 * @property {object} dataModel
 */

/**
 * Normalize options
 * @param {string|object} haystack 
 * @return {TransformRules}
 */
function normalizeRules(haystack) {
  const rules = {}
  const isObject = typeof haystack === 'object' && haystack !== null

  Object.defineProperty(rules, 'selector', { value: !isObject ? haystack : (haystack.selector || null) })
  Object.defineProperty(rules, 'isListItem', { value: !isObject ? false : (haystack.isListItem || false) })
  Object.defineProperty(rules, 'isTrimmed', { value: !isObject ? true : (haystack.isTrimmed || true) })
  Object.defineProperty(rules, 'attribute', { value: !isObject ? null : (haystack.attribute || null) })
  Object.defineProperty(rules, 'transformer', { value: !isObject ? null : (haystack.transformer || null) })
  Object.defineProperty(rules, 'dataModel', { value: !isObject ? null : (haystack.dataModel || null) })
  return rules
}

/**
 * Process single item
 * @param {cheerio.Root} $ 
 * @param {TransformRules} rules 
 * @return {Promise|any}
 */
function processSingleItem($, rules) {
  const node = $(rules.selector)
  let value = rules.attribute !== null
    ? node.attr(rules.attribute)
    : node.text()

  if (rules.isTrimmed && value)
    value = value.trim()

  if (typeof rules.transformer === 'function') {
    value = rules.transformer(value)
  }

  return value
}

/**
 * Process multiple items
 * @param {cheerio.Root} $ 
 * @param {TransformRules} rules 
 * @return {Array<Promise, any>}
 */
function processMultipleItems($, rules) {
  const nodes = $(rules.selector).toArray()
  const values = []
  
  for (const node of nodes) {
    const value = transform(node, rules.dataModel)
    values.push(value)
  }

  return values
}

/**
 * Transform HTML code to user designed data
 * @param {string} sourceHTML 
 * @param {Promise<any>} dataModel 
 */
async function transform(sourceHTML, dataModel) {
  const $ = cheerio.load(sourceHTML)
  const mappedResult = {}

  for (const key in dataModel) {
    const rules = normalizeRules(dataModel[key])
    if (rules.selector === null) continue

    const value = !rules.isListItem
      ? processSingleItem($, rules)
      : processMultipleItems($, rules)

    mappedResult[key] = await (Array.isArray(value)
      ? Promise.all(value)
      : value)
  }

  return mappedResult
}

module.exports = transform