// @flow
const https = require('https');
const http = require('http');
const {parse: parseUrl} = require('url');
const multiparty = require('multiparty');
const {createMockingServer, text, json, html} = require('./mocking-server');

const createServer = ({port, ssl}: {port: number, ssl?: Object}) => {
    const mockingServer = createMockingServer();

    const handleRequest = (request, response) => {
        const form = new multiparty.Form();
        form.parse(request, (err, formFields = {}, files) => {
            const {method, url, headers} = request;
            const {pathname = '', query = {}} = parseUrl(url, true);

            const {headers: responseHeaders, content, statusCode} = mockingServer.handle({
                method,
                urlPath: pathname,
                urlParams: query,
                headers,
                formFields,
            });

            response.statusCode = statusCode;
            Object.keys(responseHeaders).forEach(h => response.setHeader(h, responseHeaders[h]));
            response.write(content);
            response.end();
        });
    };

    const server = ssl ? https.createServer(ssl, handleRequest) : http.createServer(handleRequest);

    server.listen(port, undefined, undefined, err => {
        if (err) throw err;
    });

    return {
        close() {
            mockingServer.clearAll();
            server.close();
        },
        stub: mockingServer.stub,
        mock: mockingServer.mock,
        clearAll: mockingServer.clearAll,
    };
};

module.exports = {
    createServer,
    text,
    json,
    html,
};
