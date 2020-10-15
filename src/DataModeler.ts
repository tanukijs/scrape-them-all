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
    context?: cheerio.Element
  ): Promise<Record<string, unknown>> {
    const mappedResult = {}

    for (const key in dataModel) {
      const value = dataModel[key]
      const type = this.getValueType(value)
      console.log({ key, type })

      if (type === ValueTypeEnum.NESTED) {
        mappedResult[key] = await this.generate(value as IScheme, context)
      } else if (type === ValueTypeEnum.SIMPLE || type === ValueTypeEnum.LIST) {
        const opts = new SelectorOptions(value)
        const cheerioElement = context
          ? this.$root(opts.selector, context)
          : this.$root(opts.selector)
        const result =
          type === ValueTypeEnum.SIMPLE
            ? this.processSingleItem(cheerioElement, opts)
            : this.processListItem(cheerioElement, opts)
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

      return isSimple
        ? ValueTypeEnum.SIMPLE
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
    const listOpts = new SelectorOptions(opts.listModel)
    const type = this.getValueType(listOpts)

    if (type === ValueTypeEnum.SIMPLE || type === ValueTypeEnum.LIST) {
      const children = element.find(listOpts.selector)
      const values = []
      for (const child of children.toArray()) {
        const value = this.processSingleItem(this.$root(child), listOpts)
        values.push(value)
      }
      return values
    }

    if (type === ValueTypeEnum.NESTED) {
      const values = []
      for (const child of element.toArray()) {
        const value = this.generate(opts.listModel, child)
        values.push(value)
      }
      return values
    }

    return null
  }
}
