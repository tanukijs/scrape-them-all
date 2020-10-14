/// <reference types="cheerio" />
export declare type TMethods = {
    selector?: string;
    isListItem?: boolean;
    isTrimmed?: boolean;
    attribute?: string;
    accessor?: (x: unknown) => typeof x;
    transformer?: (x: unknown) => typeof x;
    dataModel?: Record<string, string> | Record<string, Record<keyof TMethods, unknown>>;
};
export default function transform(sourceHTML: cheerio.Element, dataModel: Record<string, Record<keyof TMethods, keyof TMethods>>): Promise<unknown>;
//# sourceMappingURL=transform.d.ts.map