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
    if (opts.type !== EOptionType.OBJECT)
      throw new Error('Schema passed to generate() must be a root object.')

    const mappedResult = {}

    for (const key in opts.children) {
      const value = new SchemeInterpreter(opts.children[key])
      const cheerioRoot =
        context && value.selector
          ? context.find(value.selector)
          : context || this.$root(value.selector)

      if (value.type === EOptionType.OBJECT) {
        mappedResult[key] = await this.generate(value, cheerioRoot)
        continue
      }

      const result =
        value.type === EOptionType.VALUE
          ? this.processValue(cheerioRoot, value)
          : value.type === EOptionType.ARRAY
          ? this.processArray(cheerioRoot, value.listModel as SchemeInterpreter)
          : value.type === EOptionType.OBJECT_ARRAY
          ? this.processObjectArray(cheerioRoot, value.listModel as SchemeInterpreter)
          : undefined
      mappedResult[key] = await (Array.isArray(result) ? Promise.all(result) : result)
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

    if (opts.attribute) value = element.attr(opts.attribute)
    if (opts.trim && value && value === 'string') value = value.trim()
    if (opts.transformer) value = opts.transformer(value)

    return value
  }

  /**
   * Process basic list
   *
   * @param {cheerio.Cheerio} element
   * @param {SchemeInterpreter} listModel
   *
   * @returns {unknown[]}
   */
  private processArray(
    element: cheerio.Cheerio,
    listModel: SchemeInterpreter
  ): unknown[] {
    const values = []
    const children = element.find(listModel.selector)
    for (let i = 0; i < children.length; i++) {
      const value = this.processValue(children.eq(i), listModel)
      values.push(value)
    }
    return values
  }

  /**
   * Process list of objects
   *
   * @param {cheerio.Cheerio} element
   * @param {SchemeInterpreter} listModel
   *
   * @returns {Promise<Record<string, unknown>>[]}
   */
  private processObjectArray(
    element: cheerio.Cheerio,
    listModel: SchemeInterpreter
  ): Promise<Record<string, unknown>>[] {
    const values = []
    for (let i = 0; i < element.length; i++) {
      const value = this.generate(listModel as SchemeInterpreter, element.eq(i))
      values.push(value)
    }
    return values
  }
}
