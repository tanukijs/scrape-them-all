"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const https_1 = require("https");
function req(url) {
    return new Promise((resolve, reject) => {
        const req = https_1.request(url, (res) => {
            let chunks = '';
            res.on('data', (chunk) => (chunks += chunk));
            res.on('error', reject);
            res.on('end', () => resolve(chunks));
        });
        req.on('error', reject);
        req.end();
    });
}
exports.default = req;
//# sourceMappingURL=request.js.map