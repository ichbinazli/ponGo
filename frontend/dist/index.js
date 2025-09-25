import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
// ES modules için __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, "../");
const server = http.createServer((req, res) => {
    let requestPath = req.url === "/" ? "/html/index.html" : req.url;
    // Dosya yolunu belirle
    let filePath;
    if (requestPath.startsWith('/dist/')) {
        // Compiled JS files
        filePath = path.join(PUBLIC_DIR, requestPath);
    }
    else if (requestPath.startsWith('/css/')) {
        // CSS files
        filePath = path.join(PUBLIC_DIR, requestPath);
    }
    else if (requestPath.startsWith('/html/') || requestPath.endsWith('.html')) {
        // HTML files
        filePath = path.join(PUBLIC_DIR, requestPath);
    }
    else {
        // Default
        filePath = path.join(PUBLIC_DIR, requestPath);
    }
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.log(`File not found: ${filePath}`);
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("404 Not Found");
            return;
        }
        const ext = path.extname(filePath);
        const mimeTypes = {
            ".html": "text/html",
            ".css": "text/css",
            ".js": "application/javascript",
            ".mjs": "application/javascript",
            ".json": "application/json"
        };
        const contentType = mimeTypes[ext] || "text/plain";
        res.writeHead(200, {
            "Content-Type": contentType,
            "Cache-Control": "no-cache"
        });
        res.end(data);
        console.log(`Served: ${requestPath} -> ${filePath}`);
    });
});
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
