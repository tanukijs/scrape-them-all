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
   * @returns {Promise<unknown>}
   */
  async generate(opts: SchemeInterpreter, context?: cheerio.Cheerio): Promise<unknown> {
    const cheerioRoot =
      context && opts.selector
        ? context.find(opts.selector)
        : context || (opts.selector ? this.$root(opts.selector) : this.$root.root())
    const processed = await this.processValue(cheerioRoot, opts)

    if (opts.type === EOptionType.VALUE) {
      return processed
    }

    if (opts.type === EOptionType.OBJECT) {
      const mappedResult = {}
      for (const key in opts.children) {
        const child = new SchemeInterpreter(opts.children[key])
        mappedResult[key] = await this.generate(child, processed as cheerio.Cheerio)
      }
      return mappedResult
    }

    if (opts.type === EOptionType.ARRAY || opts.type === EOptionType.OBJECT_ARRAY) {
      if (!(processed instanceof cheerio))
        throw new Error('Evaluated schema must return a list of cheerio elements.')

      const method =
        opts.type === EOptionType.ARRAY ? this.processArray : this.processObjectArray
      const result = method.call(
        this,
        processed as cheerio.Cheerio,
        opts.listModel as SchemeInterpreter
      )
      return Promise.all(result)
    }

    return undefined
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
    if (opts.trim && value && typeof value === 'string') value = value.trim()
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
   * @returns {Promise<unknown>[]}
   */
  private processObjectArray(
    element: cheerio.Cheerio,
    listModel: SchemeInterpreter
  ): Promise<unknown>[] {
    const values = []
    for (let i = 0; i < element.length; i++) {
      const value = this.generate(listModel, element.eq(i))
      values.push(value)
    }
    return values
  }
}
