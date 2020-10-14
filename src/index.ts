import { RequestOptions } from 'https'
import request from './Requestor'
import DataModeler, { ISelector } from './DataModeler'

export default async function ScrapeTA(
  query: string | URL | RequestOptions,
  schema: { [key: string]: ISelector }
): Promise<unknown> {
  const queryHTML = await request(query)
  const dataModeler = new DataModeler(queryHTML)
  return dataModeler.generate(schema)
}
