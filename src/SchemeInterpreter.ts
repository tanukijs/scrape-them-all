import { ScrapeTAScheme } from './typings'

export const enum EOptionType {
  VALUE,
  ARRAY,
  OBJECT,
  OBJECT_ARRAY
}

export class SchemeInterpreter {
  readonly selector: string = ''
  readonly isTrimmed: boolean = true
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
      this.isTrimmed = opts.isTrimmed || true
      this.accessor = opts.accessor || 'text'
      this.attribute = opts.attribute
      this.transformer = opts.transformer
      this.listModel = opts.listModel ? new SchemeInterpreter(opts.listModel) : undefined

      for (const key in opts) {
        if (Object.keys(this).includes(key)) continue
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

    if (
      this.listModel instanceof SchemeInterpreter &&
      Object.keys(this.listModel.children).length > 0
    )
      return EOptionType.OBJECT_ARRAY
    return EOptionType.ARRAY
  }
}
