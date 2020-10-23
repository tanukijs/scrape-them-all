import { ScrapeTAScheme } from './typings'

export const enum EOptionType {
  VALUE,
  ARRAY,
  OBJECT,
  OBJECT_ARRAY
}

const reservedKeys: string[] = [
  'selector',
  'isTrimmed',
  'accessor',
  'attribute',
  'transformer',
  'listModel'
]

export class SchemeOptions {
  readonly selector: string = ''
  readonly isTrimmed: boolean = true
  readonly accessor: string | ((node: cheerio.Cheerio) => unknown) = 'text'
  readonly attribute?: string
  readonly transformer?: (value: string) => unknown
  readonly listModel?: string | ScrapeTAScheme
  private readonly children: Record<string, unknown> = {}

  constructor(opts: string | Partial<SchemeOptions> = '') {
    if (typeof opts === 'string') {
      this.selector = opts
    } else {
      this.selector = opts.selector || ''
      this.isTrimmed = opts.isTrimmed || true
      this.accessor = opts.accessor || 'text'
      this.attribute = opts.attribute
      this.transformer = opts.transformer
      this.listModel = opts.listModel

      for (const key in opts) {
        if (reservedKeys.includes(key)) continue
        this.children[key] = opts[key]
      }
    }
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

    const listOpts = new SchemeOptions(this.listModel)
    if (Object.keys(listOpts.children).length > 0) return EOptionType.OBJECT_ARRAY
    return EOptionType.ARRAY
  }
}
