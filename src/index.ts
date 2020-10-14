import nodeFetch, { RequestInfo, RequestInit } from 'node-fetch'
import DataModeler, { ISelector } from './DataModeler'

type ConfigureOptions = {
  enableCookies: boolean
}
type QueryInfo = RequestInfo | (RequestInit & { url: RequestInfo })

let fetch = nodeFetch

export async function configure(options: ConfigureOptions): Promise<void> {
  if (options.enableCookies) {
    try {
      const { default: fetchCookie } = await require('fetch-cookie/node-fetch')
      fetch = fetchCookie(nodeFetch) as typeof nodeFetch
    } catch (e) {
      fetch = nodeFetch
      console.error(
        new Error('Please run `npm install fetch-cookie` to use this setting.')
      )
    }
  } else {
    fetch = nodeFetch
  }
}

export async function ScrapeTA(
  query: QueryInfo,
  schema: { [key: string]: ISelector }
): Promise<unknown> {
  const requestInfo = ((typeof query === 'object' && 'url' in query && query.url) ||
    query) as RequestInfo
  const requestInit = typeof query === 'object' ? (query as RequestInit) : undefined
  const req = await fetch(requestInfo, requestInit)
  const res = await req.text()
  const dataModeler = new DataModeler(res)
  return dataModeler.generate(schema)
}
