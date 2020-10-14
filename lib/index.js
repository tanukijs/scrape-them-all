"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const request_1 = tslib_1.__importDefault(require("./request"));
const transform_1 = tslib_1.__importDefault(require("./transform"));
async function ScrapeTA(url, schema) {
    const target = await request_1.default(url);
    return transform_1.default(target, schema);
}
exports.default = ScrapeTA;
//# sourceMappingURL=index.js.map