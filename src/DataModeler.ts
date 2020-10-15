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
  readonly accessor?: string | ((node: cheerio.Cheerio) => unknown)
  readonly transformer?: (value: string) => unknown
  readonly dataModel?: IDataModel
}

export { IDataModel, ISelector, ISelectorOptions }

export default class {
  private $root: cheerio.Root

  constructor(body: string) {
    this.$root = cheerio.load(body)
  }

  async generate(
    dataModel: IDataModel,
    context?: cheerio.Element
  ): Promise<Record<string, unknown>> {
    const mappedResult = {}

    for (const key in dataModel) {
      const item = this.normalizeItem(dataModel[key])

      const cheerioElement = context
        ? this.$root(item.selector, context)
        : this.$root(item.selector)

      const value = !item.isListItem
        ? this.processSingleItem(cheerioElement, item)
        : this.processMultipleItems(cheerioElement, item)

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

  private processSingleItem(element: cheerio.Cheerio, item: ISelectorOptions): unknown {
    let value =
      typeof item.accessor === 'function'
        ? item.accessor(element)
        : typeof item.accessor === 'string' && typeof element[item.accessor] !== undefined
        ? element[item.accessor]()
        : null

    if (item.attribute) value = element.attr(item.attribute as string)
    if (item.isTrimmed && value) value = value.trim()
    if (typeof item.transformer === 'function') value = item.transformer(value)

    return value
  }

  private processMultipleItems(
    element: cheerio.Cheerio,
    item: ISelectorOptions
  ): Promise<Record<string, unknown>>[] {
    if (!item.dataModel) return []
    const values = []

    for (const node of element.toArray()) {
      const value = this.generate(item.dataModel, node)
      values.push(value)
    }

    return values
  }
}
