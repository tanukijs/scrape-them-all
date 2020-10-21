import nodeFetch, { RequestInfo, RequestInit, Response } from 'node-fetch'
import { CookieJar } from 'fetch-cookie'
import { DataModeler, SelectorOptions } from './DataModeler'

type TExtraParams = {
  url: RequestInfo
  cookieJar?: boolean | CookieJar
}

type TRequest = RequestInfo | (RequestInit & TExtraParams)

export type TResult = {
  response: Response
  data: Record<string, unknown>
}

export type IScheme = {
  [key: string]: string | Partial<SelectorOptions> | IScheme
}

/**
 * Create an instance of node-fetch with managed cookies
 *
 * @param {IExtraParams} query
 * @returns {typeof nodeFetch}
 */
async function withCookies(query: TExtraParams): Promise<typeof nodeFetch> {
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
 * @param {TRequest} query
 * @param {IScheme} scheme
 *
 * @returns {Promise<IResult>}
 */
export default async function (request: TRequest, scheme: IScheme): Promise<TResult> {
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
