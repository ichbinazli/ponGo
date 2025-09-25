"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const http = __importStar(require("http"));
class API {
    constructor() {
        this.routes = [];
    }
    get(path, handler) {
        this.routes.push({ method: "GET", path, handler });
    }
    post(path, handler) {
        this.routes.push({ method: "POST", path, handler });
    }
    put(path, handler) {
        this.routes.push({ method: "PUT", path, handler });
    }
    delete(path, handler) {
        this.routes.push({ method: "DELETE", path, handler });
    }
    listen(port, cb) {
        const server = http.createServer((req, res) => {
            const match = this.routes.find((r) => r.method === req.method && r.path === req.url);
            if (match) {
                // Body parse etme (sadece POST ve PUT için)
                if (req.method === "POST" || req.method === "PUT") {
                    let body = "";
                    req.on("data", (chunk) => {
                        body += chunk;
                    });
                    req.on("end", () => {
                        try {
                            if (body) {
                                req.body = JSON.parse(body);
                            }
                        }
                        catch (err) {
                            res.writeHead(400, { "Content-Type": "application/json" });
                            res.end(JSON.stringify({ error: "Invalid JSON" }));
                            return;
                        }
                        match.handler(req, res);
                    });
                }
                else {
                    match.handler(req, res);
                }
            }
            else {
                res.writeHead(404, { "Content-Type": "text/plain" });
                res.end("Not Found");
            }
        });
        server.listen(port, cb);
    }
}
exports.api = new API();
