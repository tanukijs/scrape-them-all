import cheerio from 'cheerio'
import { EOptionType, SchemeInterpreter } from './SchemeInterpreter'

export class DataModeler {
  private $root: cheerio.Root

  constructor(body: string) {
    this.$root = cheerio.load(body)
  }

  /**
   * Generate data from HTML body & user-designed JSON scheme
   *
   * @param {SchemeInterpreter} opts
   * @param {cheerio.Cheerio} [context]
   *
   * @returns {Promise<Record<string, unknown>>}
   */
  async generate(
    opts: SchemeInterpreter,
    context?: cheerio.Cheerio
  ): Promise<Record<string, unknown>> {
    if (opts.type !== EOptionType.OBJECT) return {}
    const mappedResult = {}

    for (const key in opts.children) {
      const value = new SchemeInterpreter(opts.children[key])

      if (value.type === EOptionType.OBJECT) {
        mappedResult[key] = await this.generate(value, context)
        continue
      }

      const cheerioRoot =
        context && value.selector
          ? this.$root(value.selector, context)
          : context || this.$root(value.selector)
      const result =
        value.type === EOptionType.VALUE
          ? this.processValue(cheerioRoot, value)
          : value.type === EOptionType.ARRAY
          ? this.processArray(cheerioRoot, value)
          : value.type === EOptionType.OBJECT_ARRAY
          ? this.processObjectArray(cheerioRoot, value)
          : undefined
      mappedResult[key] = await (Array.isArray(result) ? Promise.all(result) : result)
      continue
    }

    return mappedResult
  }

  /**
   * Process single item
   *
   * @param {cheerio.Cheerio} element
   * @param {SchemeInterpreter} opts
   *
   * @returns {unknown}
   */
  private processValue(element: cheerio.Cheerio, opts: SchemeInterpreter): unknown {
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
   * @param {SchemeInterpreter} opts
   *
   * @returns {unknown[]}
   */
  private processArray(element: cheerio.Cheerio, opts: SchemeInterpreter): unknown[] {
    if (!opts.listModel) return []
    const values = []
    const listOpts = opts.listModel as SchemeInterpreter
    const children = element.find(listOpts.selector)
    for (let i = 0; i < children.length; i++) {
      const value = this.processValue(children.eq(i), listOpts)
      values.push(value)
    }
    return values
  }

  /**
   * Process list of objects
   *
   * @param {cheerio.Cheerio} element
   * @param {SchemeInterpreter} opts
   *
   * @returns {Promise<Record<string, unknown>>[]}
   */
  private processObjectArray(
    element: cheerio.Cheerio,
    opts: SchemeInterpreter
  ): Promise<Record<string, unknown>>[] {
    const values = []
    for (let i = 0; i < element.length; i++) {
      const value = this.generate(opts.listModel as SchemeInterpreter, element.eq(i))
      values.push(value)
    }
    return values
  }
}
