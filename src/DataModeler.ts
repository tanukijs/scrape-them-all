import cheerio from 'cheerio'

class SelectorOptions {
  readonly selector: string = ''
  readonly isTrimmed: boolean = true
  readonly accessor: string | ((node: cheerio.Cheerio) => unknown) = 'text'
  readonly attribute?: string
  readonly transformer?: (value: string) => unknown
  // eslint-disable-next-line no-use-before-define
  readonly listModel?: string | IScheme

  constructor(opts: string | Partial<SelectorOptions> = '') {
    if (typeof opts === 'string') {
      this.selector = opts
    } else {
      this.selector = opts.selector || ''
      this.isTrimmed = opts.isTrimmed || true
      this.accessor = opts.accessor || 'text'
      this.attribute = opts.attribute
      this.transformer = opts.transformer
      this.listModel = opts.listModel
    }
  }

  static get keys(): string[] {
    return ['selector', 'isTrimmed', 'accessor', 'attribute', 'transformer', 'listModel']
  }
}

export interface IScheme {
  [key: string]: string | Partial<SelectorOptions> | IScheme
}

export enum EValueType {
  SIMPLE,
  LIST,
  LIST_OBJECT,
  NESTED
}

export default class {
  private $root: cheerio.Root

  constructor(body: string) {
    this.$root = cheerio.load(body)
  }

  /**
   * FUNCTION DESC
   *
   * @param {IScheme} dataModel
   * @param {cheerio.Cheerio} [context]
   * @returns {Promise<Record<string, unknown>>}
   */
  async generate(
    dataModel: IScheme,
    context?: cheerio.Cheerio
  ): Promise<Record<string, unknown>> {
    const mappedResult = {}

    for (const key in dataModel) {
      const value = dataModel[key]
      const type = this.getValueType(value)

      if (type === EValueType.NESTED) {
        mappedResult[key] = await this.generate(value as IScheme, context)
        continue
      }

      const opts = new SelectorOptions(value)
      const cheerioRoot =
        context && opts.selector
          ? this.$root(opts.selector, context)
          : context || this.$root(opts.selector)
      const result =
        type === EValueType.SIMPLE
          ? this.processSingleItem(cheerioRoot, opts)
          : type === EValueType.LIST
          ? this.processListItem(cheerioRoot, opts)
          : type === EValueType.LIST_OBJECT
          ? this.processListObjectItem(cheerioRoot, opts)
          : undefined
      mappedResult[key] = await (Array.isArray(result) ? Promise.all(result) : result)
    }

    return mappedResult
  }

  /**
   * FUNCTION DESC
   *
   * @private
   * @template K
   * @param {IScheme[K]} scheme
   * @returns {(EValueType | void)}
   */
  private getValueType<K extends keyof IScheme>(scheme: IScheme[K]): EValueType | void {
    if (typeof scheme === 'string') return EValueType.SIMPLE
    else if (typeof scheme === 'object') {
      const opts = scheme as SelectorOptions
      const isSimple =
        SelectorOptions.keys.filter((key) => key in opts).length > 0 && !opts.listModel
      if (isSimple) return EValueType.SIMPLE

      const isList = opts.selector && opts.listModel
      const isObjectList =
        isList && this.getValueType(opts.listModel || {}) !== EValueType.SIMPLE
      if (isObjectList) return EValueType.LIST_OBJECT
      if (isList) return EValueType.LIST
      return EValueType.NESTED
    }
  }

  /**
   * FUNCTION DESC
   *
   * @private
   * @param {cheerio.Cheerio} element
   * @param {SelectorOptions} opts
   * @returns {unknown}
   */
  private processSingleItem(element: cheerio.Cheerio, opts: SelectorOptions): unknown {
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
   * FUNCTION DESC
   *
   * @private
   * @param {cheerio.Cheerio} element
   * @param {SelectorOptions} opts
   * @returns {unknown[]}
   */
  private processListItem(element: cheerio.Cheerio, opts: SelectorOptions): unknown[] {
    if (!opts.listModel) return []
    const values = []
    const listOpts = new SelectorOptions(opts.listModel)
    const children = element.find(listOpts.selector)
    for (let i = 0; i < children.length; i++) {
      const value = this.processSingleItem(children.eq(i), listOpts)
      values.push(value)
    }
    return values
  }

  /**
   * FUNCTION DESC
   *
   * @private
   * @param {cheerio.Cheerio} element
   * @param {SelectorOptions} opts
   * @returns {Promise<Record<string, unknown>>[]}
   */
  private processListObjectItem(
    element: cheerio.Cheerio,
    opts: SelectorOptions
  ): Promise<Record<string, unknown>>[] {
    const values = []
    for (let i = 0; i < element.length; i++) {
      const value = this.generate(opts.listModel as IScheme, element.eq(i))
      values.push(value)
    }
    return values
  }
}
