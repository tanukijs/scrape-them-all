import { TMethods } from './transform';
declare type TBasicSchema = {
    [key: string]: string;
};
declare type TNestedSchema = {
    [key: string]: {
        [value in keyof TMethods]: string;
    };
};
declare type schema = TBasicSchema | TNestedSchema;
export default function ScrapeTA(url: string, schema: schema): Promise<Record<string, unknown>>;
export {};
//# sourceMappingURL=index.d.ts.map