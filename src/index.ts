import nodeFetch, { RequestInfo, RequestInit, Response } from 'node-fetch'
import { DataModeler, IScheme } from './DataModeler'

interface ICustomParams {
  url: RequestInfo
  cookieJar?: boolean | unknown
}

type TQueryInfo = RequestInfo | (RequestInit & ICustomParams)

interface IScrapeResult {
  request: Response
  data: Record<string, unknown>
}

/**
 * Create an instance of node-fetch with managed cookies
 *
 * @param {ICustomParams} query
 * @returns {typeof nodeFetch}
 */
function withCookies(query: ICustomParams): typeof nodeFetch {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fetchCookie = require('fetch-cookie/node-fetch')
    const cookieJar = typeof query.cookieJar === 'boolean' ? null : query.cookieJar
    return fetchCookie(nodeFetch, cookieJar)
  } catch (e) {
    throw new Error('Please run `npm install fetch-cookie` to use the cookieJar option.')
  }
}

/**
 * Get HTML and transform it as user-designed object
 *
 * @export
 * @param {QueryInfo} query
 * @param {IScheme} schema
 * @returns {Promise<IScrapeResult>}
 */
export async function ScrapeTA(
  query: TQueryInfo,
  schema: IScheme
): Promise<IScrapeResult> {
  const fetch =
    typeof query === 'object' && 'cookieJar' in query && query.cookieJar
      ? withCookies(query)
      : nodeFetch
  const requestInfo = ((typeof query === 'object' && 'url' in query && query.url) ||
    query) as RequestInfo
  const requestInit = typeof query === 'object' ? (query as RequestInit) : undefined
  const req = await fetch(requestInfo, requestInit)
  const res = await req.text()
  const dataModeler = new DataModeler(res)
  const data = await dataModeler.generate(schema)
  return { request: req, data }
}
