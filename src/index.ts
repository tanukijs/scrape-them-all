import nodeFetch, { RequestInfo, RequestInit, Response } from 'node-fetch'
import { CookieJar } from 'fetch-cookie'
import { DataModeler, IScheme } from './DataModeler'

interface IExtraParams {
  url: RequestInfo
  cookieJar?: boolean | CookieJar
}

type TScrapeRequest = RequestInfo | (RequestInit & IExtraParams)

interface IScrapeResult {
  resInfo: Response
  data: Record<string, unknown>
}

/**
 * Create an instance of node-fetch with managed cookies
 *
 * @param {IExtraParams} query
 * @returns {typeof nodeFetch}
 */
async function withCookies(query: IExtraParams): Promise<typeof nodeFetch> {
  try {
    const fetchCookie = (await import('fetch-cookie/node-fetch')).default
    const cookieJar = typeof query.cookieJar === 'boolean' ? undefined : query.cookieJar
    return fetchCookie(nodeFetch, cookieJar) as typeof nodeFetch
  } catch (e) {
    throw new Error('Please run `npm install fetch-cookie` to use the cookieJar option.')
  }
}

/**
 * Get HTML body and transform it as user-designed object
 *
 * @param {TScrapeRequest} query
 * @param {IScheme} scheme
 *
 * @returns {Promise<IScrapeResult>}
 */
export async function ScrapeTA(
  query: TScrapeRequest,
  scheme: IScheme
): Promise<IScrapeResult> {
  const fetch = await (typeof query === 'object' &&
  'cookieJar' in query &&
  query.cookieJar
    ? withCookies(query)
    : nodeFetch)
  const requestInfo = ((typeof query === 'object' && 'url' in query && query.url) ||
    query) as RequestInfo
  const requestInit = typeof query === 'object' ? (query as RequestInit) : undefined
  const res = await fetch(requestInfo, requestInit)
  const dataModeler = new DataModeler(await res.text())
  const data = await dataModeler.generate(scheme)
  return { resInfo: res, data }
}
