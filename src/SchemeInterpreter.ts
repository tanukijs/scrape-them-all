import { ScrapeTAScheme } from './typings'

export const enum EOptionType {
  VALUE,
  ARRAY,
  OBJECT,
  OBJECT_ARRAY
}

export class SchemeInterpreter {
  readonly selector: string = ''
  readonly trim: boolean = true
  readonly accessor: string | ((node: cheerio.Cheerio) => unknown) = 'text'
  readonly attribute?: string
  readonly transformer?: (value: string) => unknown
  readonly listModel?: string | ScrapeTAScheme | SchemeInterpreter
  readonly children: Record<string, string | ScrapeTAScheme> = {}

  constructor(opts: string | Partial<SchemeInterpreter> = '') {
    if (typeof opts === 'string') {
      this.selector = opts
    } else {
      this.selector = opts.selector || ''
      this.trim = opts.trim || true
      this.accessor = opts.accessor || 'text'
      this.attribute = opts.attribute
      this.transformer = opts.transformer
      this.listModel = opts.listModel ? new SchemeInterpreter(opts.listModel) : undefined

      const reservedKeys = Object.keys(this)
      for (const key in opts) {
        const normalizedKey = key[0] === '_' ? key.slice(1) : key
        if (reservedKeys.includes(key) && normalizedKey === key) continue
        this.children[normalizedKey] = opts[key]
      }
    }
    this.validate()
  }

  /**
   * Get type of an input
   *
   * @param {ScrapeTAScheme[K]} scheme
   * @returns {EOptionType}
   */
  public get type(): EOptionType {
    if (Object.keys(this.children).length > 0) return EOptionType.OBJECT
    if (!this.listModel) return EOptionType.VALUE

    if (
      this.listModel instanceof SchemeInterpreter &&
      Object.keys(this.listModel.children).length > 0
    )
      return EOptionType.OBJECT_ARRAY
    return EOptionType.ARRAY
  }

  public validate(): void {
    const expected = [
      { property: 'selector', equalsTo: ['string'] },
      { property: 'trim', equalsTo: ['boolean'] },
      { property: 'accessor', equalsTo: ['string', 'function'] },
      { property: 'attribute', equalsTo: ['string'] },
      { property: 'transformer', equalsTo: ['function'] },
      { property: 'listModel', equalsTo: ['string', 'object'] }
    ]

    for (const { property, equalsTo } of expected) {
      if (!this[property]) continue
      const asExpectedValue = equalsTo.map((type) => typeof this[property] === type)
      if (asExpectedValue.includes(true)) continue
      const errorTypes = equalsTo.join(' or a ')
      const errorMessage = [
        `The property "${property}" expects a ${errorTypes}.`,
        `If you want to use "${property}" as a result key, prefix it with an underscore (the first will be stripped automatically).`
      ].join(' ')
      throw new Error(errorMessage)
    }
  }
}
