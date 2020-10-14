import cheerio from 'cheerio'

/* eslint-disable no-use-before-define */
type IDataModel = Record<string, string | ISelectorOptions>
type ISelector = string | ISelectorOptions
/* eslint-enable no-use-before-define */

interface ISelectorOptions {
  readonly selector: string
  readonly isListItem?: boolean
  readonly isTrimmed?: boolean
  readonly attribute?: string
  readonly accessor?: string | ((node: cheerio.Cheerio) => string | number | boolean)
  readonly transformer?: (x: unknown) => unknown
  readonly dataModel?: IDataModel
}

export { IDataModel, ISelector, ISelectorOptions }

export default class {
  private $root: cheerio.Root

  constructor(body: string) {
    this.$root = cheerio.load(body)
  }

  async generate(dataModel: IDataModel, context?: cheerio.Element): Promise<unknown> {
    const mappedResult: Record<string, unknown> = {}

    for (const key in dataModel) {
      const item = this.normalizeItem(dataModel[key])
      if (item.selector === null) continue

      const value = !item.isListItem
        ? this.processSingleItem(item, context)
        : this.processMultipleItems(item, context)

      mappedResult[key] = await (Array.isArray(value) ? Promise.all(value) : value)
    }

    return mappedResult
  }

  private normalizeItem(item: string | ISelectorOptions): ISelectorOptions {
    const isObject = typeof item === 'object' && item !== null
    const options: ISelectorOptions = {
      selector: !isObject ? (item as string) : (item as ISelectorOptions).selector || '',
      isListItem: !isObject ? false : (item as ISelectorOptions).isListItem || false,
      isTrimmed: !isObject ? true : (item as ISelectorOptions).isTrimmed || true,
      attribute: !isObject
        ? undefined
        : (item as ISelectorOptions).attribute || undefined,
      accessor: !isObject ? 'text' : (item as ISelectorOptions).accessor || 'text',
      transformer: !isObject
        ? undefined
        : (item as ISelectorOptions).transformer || undefined,
      dataModel: !isObject ? undefined : (item as ISelectorOptions).dataModel || undefined
    }

    return Object.freeze(options)
  }

  private processSingleItem(
    item: ISelectorOptions,
    context?: cheerio.Element
  ): ISelectorOptions {
    const node = context ? this.$root(item.selector, context) : this.$root(item.selector)
    let value =
      typeof item.accessor === 'function'
        ? item.accessor(node)
        : typeof item.accessor === 'string' && typeof node[item.accessor] !== undefined
        ? node[item.accessor]()
        : null

    if (item.attribute) value = node.attr(item.attribute as string)
    if (item.isTrimmed && value) value = value.trim()
    if (typeof item.transformer === 'function') value = item.transformer(value)

    return value
  }

  private processMultipleItems(
    item: ISelectorOptions,
    context?: cheerio.Element
  ): Promise<unknown>[] {
    if (!item.dataModel) return []
    const nodes = context ? this.$root(item.selector, context) : this.$root(item.selector)
    const values = []

    for (const node of nodes.toArray()) {
      const value = this.generate(item.dataModel, node)
      values.push(value)
    }

    return values
  }
}
