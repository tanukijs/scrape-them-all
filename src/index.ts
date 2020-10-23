import nodeFetch, { RequestInfo, RequestInit } from 'node-fetch'
import { DataModeler } from './DataModeler'
import {
  ScrapeTAExtraParams,
  ScrapeTARequest,
  ScrapeTAScheme,
  ScrapeTAResult
} from './typings'
export * from './typings'

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
 * @returns {Promise<TResult>}
 */
export async function scrapeTA(
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
