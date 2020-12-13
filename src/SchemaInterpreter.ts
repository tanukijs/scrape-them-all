import { ScrapeTASchema } from './index'

export const enum EOptionType {
  VALUE,
  ARRAY,
  OBJECT,
  OBJECT_ARRAY
}

export class SchemaInterpreter {
  readonly selector: string = ''
  readonly trim: boolean = true
  readonly accessor: string | ((node: cheerio.Cheerio) => unknown) = 'text'
  readonly attribute?: string
  readonly transformer?: (value: string) => unknown
  readonly listModel?: string | ScrapeTASchema | SchemaInterpreter
  readonly children: Record<string, string | ScrapeTASchema> = {}

  constructor(opts: string | Partial<SchemaInterpreter> = '') {
    if (typeof opts === 'string') {
      this.selector = opts
    } else {
      this.selector = opts.selector || ''
      this.trim = opts.trim || true
      this.listModel = opts.listModel ? new SchemaInterpreter(opts.listModel) : undefined
      this.attribute = opts.attribute
      this.transformer = opts.transformer

      const reservedKeys = Object.keys(this)
      for (const key in opts) {
        const normalizedKey = key[0] === '_' ? key.slice(1) : key
        const isReservedKey = reservedKeys.includes(normalizedKey)
        if (isReservedKey && normalizedKey === key) continue
        const usedKey = isReservedKey ? normalizedKey : key
        this.children[usedKey] = opts[key]
      }

      this.accessor =
        opts.accessor || (this.type === EOptionType.VALUE ? 'text' : (x) => x)
    }
    this.validate()
  }

  /**
   * Get type of an input
   *
   * @param {ScrapeTASchema[K]} schema
   * @returns {EOptionType}
   */
  public get type(): EOptionType {
    if (Object.keys(this.children).length > 0) return EOptionType.OBJECT
    if (!this.listModel) return EOptionType.VALUE

    if (
      this.listModel instanceof SchemaInterpreter &&
      Object.keys(this.listModel.children).length > 0
    )
      return EOptionType.OBJECT_ARRAY
    return EOptionType.ARRAY
  }

  /**
   * Validate current SchemaInterpreter object
   *
   * @returns {void}
   * @throws {Error}
   */
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
