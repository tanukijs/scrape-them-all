import { CookieJar } from 'fetch-cookie'
import nodeFetch, { RequestInfo, RequestInit, Response } from 'node-fetch'
import { DataModeler } from './DataModeler'

type RequestWithCookies = {
  url: RequestInfo
  cookieJar?: boolean | CookieJar
}

export type ScrapeTARequest = RequestInfo | (RequestWithCookies & RequestInit)

type SchemeOptions = {
  selector?: string
  isTrimmed?: boolean
  accessor?: string | ((node: cheerio.Cheerio) => unknown)
  attribute?: string
  transformer?: (value: string) => unknown
  // eslint-disable-next-line no-use-before-define
  listModel?: string | ScrapeTAScheme
}

export type ScrapeTAResult = {
  response: Response
  data: Record<string, unknown>
}

export type ScrapeTAScheme = {
  [key: string]: string | SchemeOptions | ScrapeTAScheme
}

/**
 * Create an instance of node-fetch with managed cookies
 *
 * @param {ReqWithCookies} query
 * @returns {Promise<typeof nodeFetch>}
 */
async function withCookies(query: RequestWithCookies): Promise<typeof nodeFetch> {
  try {
    const { default: fetchCookie } = await import('fetch-cookie/node-fetch')
    const cookieJar = typeof query.cookieJar === 'boolean' ? undefined : query.cookieJar
    return fetchCookie(nodeFetch, cookieJar) as typeof nodeFetch
  } catch (e) {
    throw new Error('Please run `npm install fetch-cookie` to use the cookieJar option.')
  }
}

/**
 * Get HTML body and transform it as user-designed object
 *
 * @param {BasicReq} query
 * @param {Scheme} scheme
 *
 * @returns {Promise<Result>}
 */
export default async function (
  request: ScrapeTARequest,
  scheme: ScrapeTAScheme
): Promise<ScrapeTAResult> {
  const fetch =
    typeof request === 'object' && 'cookieJar' in request && request.cookieJar
      ? await withCookies(request)
      : nodeFetch
  const requestInfo = ((typeof request === 'object' && 'url' in request && request.url) ||
    request) as RequestInfo
  const requestInit = typeof request === 'object' ? (request as RequestInit) : undefined
  const response = await fetch(requestInfo, requestInit)
  const responseHTML = await response.text()
  const dataModeler = new DataModeler(responseHTML)
  const data = await dataModeler.generate(scheme)
  return { response, data }
}
