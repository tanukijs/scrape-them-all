import nodeFetch, { RequestInfo, RequestInit, Response } from 'node-fetch'
import { SchemeInterpreter } from './SchemeInterpreter'
import { DataModeler } from './DataModeler'
import { CookieJar } from 'fetch-cookie'

type TSchemeInterpreter = Partial<
  Pick<
    SchemeInterpreter,
    'selector' | 'trim' | 'accessor' | 'attribute' | 'transformer' | 'listModel'
  >
>

export type ScrapeTAExtraParams = {
  url: RequestInfo
  cookieJar?: boolean | CookieJar
}

export type ScrapeTAScheme = {
  [key: string]: string | TSchemeInterpreter | ScrapeTAScheme
}

export type ScrapeTARequest = RequestInfo | (ScrapeTAExtraParams & RequestInit)

export type ScrapeTAResult<T> = {
  response: Response
  data: T
}

/**
 * Create an instance of node-fetch with managed cookies
 *
 * @param {ScrapeTAExtraParams} query
 * @returns {Promise<typeof nodeFetch>}
 */
async function withCookies(query: ScrapeTAExtraParams): Promise<typeof nodeFetch> {
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
 * @param {ScrapeTARequest} query
 * @param {ScrapeTAScheme} scheme
 *
 * @returns {Promise<ScrapeTAResult<T>>}
 */
export async function scrapeTA<T>(
  request: ScrapeTARequest,
  scheme: ScrapeTAScheme
): Promise<ScrapeTAResult<T>> {
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
  const usableScheme = new SchemeInterpreter(scheme)
  const data = (await dataModeler.generate(usableScheme)) as T
  return { response, data }
}
