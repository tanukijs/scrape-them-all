import { RequestInfo, RequestInit, Response } from 'node-fetch'
import { CookieJar } from 'fetch-cookie'
import { SchemeOptions } from './SchemeOptions'

export type ScrapeTAExtraParams = {
  url: RequestInfo
  cookieJar?: boolean | CookieJar
}

export type ScrapeTARequest = RequestInfo | (ScrapeTAExtraParams & RequestInit)

export type ScrapeTAResult = {
  response: Response
  data: Record<string, unknown>
}

type TSchemeOptions = Partial<SchemeOptions>
export type ScrapeTAScheme = {
  [key: string]: string | TSchemeOptions | ScrapeTAScheme
}
