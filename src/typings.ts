import { RequestInfo, RequestInit, Response } from 'node-fetch'
import { CookieJar } from 'fetch-cookie'
import { SchemeInterpreter } from './SchemeInterpreter'

export type ScrapeTAExtraParams = {
  url: RequestInfo
  cookieJar?: boolean | CookieJar
}

export type ScrapeTARequest = RequestInfo | (ScrapeTAExtraParams & RequestInit)

export type ScrapeTAResult = {
  response: Response
  data: Record<string, unknown>
}

type TSchemeInterpreter = Partial<
  Pick<
    SchemeInterpreter,
    'selector' | 'accessor' | 'attribute' | 'isTrimmed' | 'listModel' | 'transformer'
  >
>
export type ScrapeTAScheme = {
  [key: string]: string | TSchemeInterpreter | ScrapeTAScheme
}
