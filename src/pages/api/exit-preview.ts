const url = require('url');

export default async function exit(req, res) {
    res.clearPreviewData();
    res.writeHead(307, { Location: '/' });
    res.end();
}