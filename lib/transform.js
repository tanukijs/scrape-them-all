"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const cheerio_1 = tslib_1.__importDefault(require("cheerio"));
function normalizeRules(item) {
    const rules = {};
    const isObject = typeof item === 'object' && item !== null;
    Object.defineProperty(rules, 'selector', {
        value: !isObject ? item : item.selector || null
    });
    Object.defineProperty(rules, 'isListItem', {
        value: !isObject ? false : item.isListItem || false
    });
    Object.defineProperty(rules, 'isTrimmed', {
        value: !isObject ? true : item.isTrimmed || true
    });
    Object.defineProperty(rules, 'attribute', {
        value: !isObject ? null : item.attribute || null
    });
    Object.defineProperty(rules, 'accessor', {
        value: !isObject ? 'text' : item.accessor || 'text'
    });
    Object.defineProperty(rules, 'transformer', {
        value: !isObject ? null : item.transformer || null
    });
    Object.defineProperty(rules, 'dataModel', {
        value: !isObject ? null : item.dataModel || null
    });
    return rules;
}
function processSingleItem($, rules) {
    const node = $(rules.selector);
    let value = typeof rules.accessor === 'function'
        ? rules.accessor(node)
        : typeof rules.accessor === 'string'
            ? node[rules.accessor]()
            : null;
    if (rules.attribute !== null)
        value = node.attr(rules.attribute);
    if (rules.isTrimmed && value)
        value = value.trim();
    if (typeof rules.transformer === 'function')
        value = rules.transformer(value);
    return value;
}
function processMultipleItems($, rules) {
    const nodes = $(rules.selector).toArray();
    const values = [];
    for (const node of nodes) {
        const value = transform(node, rules.dataModel);
        values.push(value);
    }
    return values;
}
async function transform(sourceHTML, dataModel) {
    const $ = cheerio_1.default.load(sourceHTML);
    const mappedResult = {};
    for (const key in dataModel) {
        const rules = normalizeRules(dataModel[key]);
        if (rules.selector === null)
            continue;
        const value = !rules.isListItem
            ? processSingleItem($, rules)
            : processMultipleItems($, rules);
        mappedResult[key] = await (Array.isArray(value) ? Promise.all(value) : value);
    }
    return mappedResult;
}
exports.default = transform;
//# sourceMappingURL=transform.js.map