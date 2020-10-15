import cheerio from 'cheerio'

class SelectorOptions {
  readonly selector: string = ''
  readonly isTrimmed: boolean = true
  readonly accessor: string | ((node: cheerio.Cheerio) => unknown) = 'text'
  readonly attribute?: string
  readonly transformer?: (value: string) => unknown
  // eslint-disable-next-line no-use-before-define
  readonly listModel?: IScheme

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

interface IScheme {
  [key: string]: string | Partial<SelectorOptions> | IScheme
}

enum ValueTypeEnum {
  SIMPLE,
  LIST,
  LIST_OBJECT,
  NESTED
}

export { IScheme, SelectorOptions }

export default class {
  private $root: cheerio.Root

  constructor(body: string) {
    this.$root = cheerio.load(body)
  }

  async generate(
    dataModel: IScheme,
    context?: cheerio.Cheerio
  ): Promise<Record<string, unknown>> {
    const mappedResult = {}

    for (const key in dataModel) {
      const value = dataModel[key]
      const type = this.getValueType(value)

      if (type === ValueTypeEnum.NESTED) {
        mappedResult[key] = await this.generate(value as IScheme, context)
      } else if (
        type === ValueTypeEnum.SIMPLE ||
        type === ValueTypeEnum.LIST ||
        type === ValueTypeEnum.LIST_OBJECT
      ) {
        const opts = new SelectorOptions(value)
        const cheerioRoot =
          context && opts.selector
            ? this.$root(opts.selector, context)
            : context || this.$root(opts.selector)
        const result =
          type === ValueTypeEnum.SIMPLE
            ? this.processSingleItem(cheerioRoot, opts)
            : this.processListItem(cheerioRoot, opts)
        mappedResult[key] = await (Array.isArray(result) ? Promise.all(result) : result)
      }
    }

    return mappedResult
  }

  private getValueType<K extends keyof IScheme>(
    scheme: IScheme[K]
  ): ValueTypeEnum | void {
    if (typeof scheme === 'string') return ValueTypeEnum.SIMPLE
    else if (typeof scheme === 'object') {
      const opts: SelectorOptions = scheme as SelectorOptions
      const isSimple =
        SelectorOptions.keys.filter((key) => key in opts).length > 0 && !opts.listModel
      const isList = opts.selector && opts.listModel
      const isObjectList =
        isList && this.getValueType(opts.listModel || {}) !== ValueTypeEnum.SIMPLE

      return isSimple
        ? ValueTypeEnum.SIMPLE
        : isObjectList
        ? ValueTypeEnum.LIST_OBJECT
        : isList
        ? ValueTypeEnum.LIST
        : ValueTypeEnum.NESTED
    }
  }

  private processSingleItem(element: cheerio.Cheerio, opts: SelectorOptions): unknown {
    let value =
      typeof opts.accessor === 'function'
        ? opts.accessor(element)
        : typeof opts.accessor === 'string' && typeof element[opts.accessor] !== undefined
        ? element[opts.accessor]()
        : null

    if (opts.attribute) value = element.attr(opts.attribute as string)
    if (opts.isTrimmed && value) value = value.trim()
    if (typeof opts.transformer === 'function') value = opts.transformer(value)

    return value
  }

  private processListItem(element: cheerio.Cheerio, opts: SelectorOptions): unknown {
    if (!opts.listModel) return []
    const type = this.getValueType(opts)

    if (type === ValueTypeEnum.LIST) {
      const listOpts = new SelectorOptions(opts.listModel)
      const children = element.find(listOpts.selector)
      const values = []
      for (let i = 0; i < children.length; i++) {
        const value = this.processSingleItem(children.eq(i), listOpts)
        values.push(value)
      }
      return values
    } else if (type === ValueTypeEnum.LIST_OBJECT) {
      const values = []
      for (let i = 0; i < element.length; i++) {
        const value = this.generate(opts.listModel, element.eq(i))
        values.push(value)
      }
      return values
    }

    return []
  }
}
