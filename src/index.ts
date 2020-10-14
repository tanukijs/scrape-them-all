import req from './request'
import transform from './transform'

export interface IScrapeOptions {
  selector?: string
  isListItem?: boolean
  isTrimmed?: boolean
  attribute?: string
  accessor?: string | ((node: cheerio.Cheerio) => string | number | boolean)
  transformer?: (x: unknown) => typeof x
  dataModel?: Record<string, string | IScrapeOptions>
}

export interface ISchema {
  [key: string]: string | IScrapeOptions
}

export default async function ScrapeTA(
  url: string,
  schema: ISchema
): Promise<IScrapeOptions> {
  const target = await req(url)
  return transform(target, schema)
}
