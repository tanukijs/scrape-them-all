import cheerio from 'cheerio'
import { ScrapeTAScheme } from './typings'
import { SchemeOptions, EOptionType } from './SchemeOptions'

export class DataModeler {
  private $root: cheerio.Root

  constructor(body: string) {
    this.$root = cheerio.load(body)
  }

  /**
   * Generate data from HTML body & user-designed JSON scheme
   *
   * @param {ScrapeTAScheme} dataModel
   * @param {cheerio.Cheerio} [context]
   *
   * @returns {Promise<Record<string, unknown>>}
   */
  async generate(
    dataModel: ScrapeTAScheme,
    context?: cheerio.Cheerio
  ): Promise<Record<string, unknown>> {
    const mappedResult = {}

    for (const key in dataModel) {
      const value = dataModel[key]
      const opts = new SchemeOptions(value)

      if (opts.type === EOptionType.OBJECT) {
        mappedResult[key] = await this.generate(value as ScrapeTAScheme, context)
        continue
      }

      const cheerioRoot =
        context && opts.selector
          ? this.$root(opts.selector, context)
          : context || this.$root(opts.selector)
      const result =
        opts.type === EOptionType.VALUE
          ? this.processSingleItem(cheerioRoot, opts)
          : opts.type === EOptionType.ARRAY
          ? this.processListItem(cheerioRoot, opts)
          : opts.type === EOptionType.OBJECT_ARRAY
          ? this.processListObjectItem(cheerioRoot, opts)
          : undefined
      mappedResult[key] = await (Array.isArray(result) ? Promise.all(result) : result)
    }

    return mappedResult
  }

  /**
   * Process single item
   *
   * @param {cheerio.Cheerio} element
   * @param {SchemeOptions} opts
   *
   * @returns {unknown}
   */
  private processSingleItem(element: cheerio.Cheerio, opts: SchemeOptions): unknown {
    let value =
      typeof opts.accessor === 'function'
        ? opts.accessor(element)
        : typeof opts.accessor === 'string' && typeof element[opts.accessor] !== undefined
        ? element[opts.accessor]()
        : null

    if (opts.attribute) value = element.attr(opts.attribute as string)
    if (opts.isTrimmed && value && typeof value === 'string') value = value.trim()
    if (typeof opts.transformer === 'function') value = opts.transformer(value)

    return value
  }

  /**
   * Process basic list
   *
   * @param {cheerio.Cheerio} element
   * @param {SchemeOptions} opts
   *
   * @returns {unknown[]}
   */
  private processListItem(element: cheerio.Cheerio, opts: SchemeOptions): unknown[] {
    if (!opts.listModel) return []
    const values = []
    const listOpts = new SchemeOptions(opts.listModel)
    const children = element.find(listOpts.selector)
    for (let i = 0; i < children.length; i++) {
      const value = this.processSingleItem(children.eq(i), listOpts)
      values.push(value)
    }
    return values
  }

  /**
   * Process list of objects
   *
   * @param {cheerio.Cheerio} element
   * @param {SchemeOptions} opts
   *
   * @returns {Promise<Record<string, unknown>>[]}
   */
  private processListObjectItem(
    element: cheerio.Cheerio,
    opts: SchemeOptions
  ): Promise<Record<string, unknown>>[] {
    const values = []
    for (let i = 0; i < element.length; i++) {
      const value = this.generate(opts.listModel as ScrapeTAScheme, element.eq(i))
      values.push(value)
    }
    return values
  }
}
