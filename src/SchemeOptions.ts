import { ScrapeTAScheme } from './typings'

export class SchemeOptions {
  readonly selector: string = ''
  readonly isTrimmed: boolean = true
  readonly accessor: string | ((node: cheerio.Cheerio) => unknown) = 'text'
  readonly attribute?: string
  readonly transformer?: (value: string) => unknown
  readonly listModel?: string | ScrapeTAScheme

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
    }
  }

  static get keys(): string[] {
    return ['selector', 'isTrimmed', 'accessor', 'attribute', 'transformer', 'listModel']
  }
}
