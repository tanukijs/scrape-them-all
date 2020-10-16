import nodeFetch, { RequestInfo, RequestInit } from 'node-fetch'
import { DataModeler, IScheme } from './DataModeler'

interface CustomParams {
  url: RequestInfo
  cookieJar?: boolean | unknown
}

type TQueryInfo = RequestInfo | (RequestInit & CustomParams)

/**
 * FUNCTION DESC
 *
 * @param {CustomParams} query
 * @returns {typeof nodeFetch}
 */
function withCookies(query: CustomParams): typeof nodeFetch {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fetchCookie = require('fetch-cookie/node-fetch')
    const cookieJar = typeof query.cookieJar === 'boolean' ? null : query.cookieJar
    return fetchCookie(nodeFetch, cookieJar) as typeof nodeFetch
  } catch (e) {
    throw new Error('Please run `npm install fetch-cookie` to use the cookieJar option.')
  }
}

/**
 * FUNCTION DESC
 *
 * @export
 * @param {QueryInfo} query
 * @param {IScheme} schema
 * @returns {Promise<Record<string, unknown>>}
 */
export async function ScrapeTA(
  query: TQueryInfo,
  schema: IScheme
): Promise<Record<string, unknown>> {
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
  return dataModeler.generate(schema)
}
