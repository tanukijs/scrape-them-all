import cheerio from 'cheerio'
import { IScrapeOptions } from '.'

/**
 * @typedef {object} TransformRules
 * @property {string|null} selector
 * @property {boolean} isListItem
 * @property {boolean} isTrimmed
 * @property {string} attribute
 * @property {function} accessor
 * @property {function} transformer
 * @property {object} dataModel
 */

function normalizeRules(item: Record<string, string | IScrapeOptions>): IScrapeOptions {
    const rules = {}

    const isObject = typeof item === 'object' && item !== null

    Object.defineProperty(rules, 'selector', {
        value: !isObject ? item : item.selector || null
    })
    Object.defineProperty(rules, 'isListItem', {
        value: !isObject ? false : item.isListItem || false
    })
    Object.defineProperty(rules, 'isTrimmed', {
        value: !isObject ? true : item.isTrimmed || true
    })
    Object.defineProperty(rules, 'attribute', {
        value: !isObject ? null : item.attribute || null
    })
    Object.defineProperty(rules, 'accessor', {
        value: !isObject ? 'text' : item.accessor || 'text'
    })
    Object.defineProperty(rules, 'transformer', {
        value: !isObject ? null : item.transformer || null
    })
    Object.defineProperty(rules, 'dataModel', {
        value: !isObject ? null : item.dataModel || null
    })

    return rules
}

function processSingleItem($: cheerio.Root, rules: IScrapeOptions): IScrapeOptions {
    const node = $(rules.selector)
    let value =
        typeof rules.accessor === 'function'
            ? rules.accessor(node)
            : typeof rules.accessor === 'string'
            ? node[rules.accessor]()
            : null

    if (rules.attribute !== null) value = node.attr(rules.attribute as string)

    if (rules.isTrimmed && value) value = value.trim()

    if (typeof rules.transformer === 'function') value = rules.transformer(value)

    return value
}

function processMultipleItems(
    $: cheerio.Root,
    rules: IScrapeOptions
): Promise<IScrapeOptions>[] {
    const nodes = $(rules.selector).toArray()
    const values = []

    for (const node of nodes) {
        const value = transform(node, rules.dataModel)
        values.push(value)
    }

    return values
}

export default async function transform(
    sourceHTML: cheerio.Element,
    dataModel: Record<string, string | IScrapeOptions> | undefined
): Promise<IScrapeOptions> {
    const $ = cheerio.load(sourceHTML)
    const mappedResult: { [key: string]: IScrapeOptions | IScrapeOptions[] } = {}

    for (const key in dataModel) {
        const rules = normalizeRules(
            dataModel[key] as Record<string, string | IScrapeOptions>
        )
        if (rules.selector === null) continue

        const value = !rules.isListItem
            ? processSingleItem($, rules)
            : processMultipleItems($, rules)

        mappedResult[key] = await (Array.isArray(value) ? Promise.all(value) : value)
    }

    return mappedResult
}
