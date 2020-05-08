// @flow
import type {Request, Response} from './mocking-server';
const https = require('https');
const http = require('http');
const {parse: parseUrl} = require('url');
const multiparty = require('multiparty');
const {createMockingServer, text, json, html} = require('./mocking-server');

type RequestPredicate = (req: Request) => boolean;

type MockingServer = $Call<typeof createMockingServer, any>;

type Server = {
    port: number,
    close: () => Promise<void>,
    clearAll: $PropertyType<MockingServer, 'clearAll'>,
    getRequests: $PropertyType<MockingServer, 'getRequests'>,
    mock: $PropertyType<MockingServer, 'mock'>,
    mockImplementation: $PropertyType<MockingServer, 'mockImplementation'>,
    stub: $PropertyType<MockingServer, 'stub'>,
};

type Options = {
    port?: number,
    ssl?: Object,
    onResponseNotFound?: (r: Request) => mixed,
};

const createServer = (options?: Options): Server => {
    const {port = 0, ssl, onResponseNotFound} = options || {};
    const mockingServer = createMockingServer({onResponseNotFound});

    const handleRequest = (request, response) => {
        const form = new multiparty.Form();
        form.parse(request, (err, formFields = {}, files) => {
            const {method, url, headers} = request;
            const {pathname, query = {}} = parseUrl(url, true);

            if (pathname === '/__admin__/kill') {
                response.write('killed');
                response.end(() => {
                    process.exit();
                });
            }

            const res = mockingServer.handle({
                method,
                urlPath: pathname || '',
                urlParams: query,
                headers,
                formFields,
            });

            if (res) {
                const {headers: responseHeaders, content, statusCode} = res;

                response.statusCode = statusCode;
                Object.keys(responseHeaders).forEach(h => response.setHeader(h, responseHeaders[h]));
                response.write(content);
                response.end();
            }
        });
    };

    const server = ssl ? https.createServer(ssl, handleRequest) : http.createServer(handleRequest);

    server.listen(port, undefined, undefined, err => {
        if (err) throw err;
    });

    const connections = new Set();

    server.on('connection', conn => {
        connections.add(conn);
        conn.on('close', () => {
            connections.delete(conn);
        });
    });

    return {
        close(): Promise<void> {
            return new Promise(resolve => {
                mockingServer.clearAll();
                server.close(() => {
                    resolve();
                });
                connections.forEach(conn => {
                    conn.destroy();
                });
                connections.clear();
            });
        },
        stub: mockingServer.stub,
        mock: mockingServer.mock,
        mockImplementation: mockingServer.mockImplementation,
        getRequests: mockingServer.getRequests,
        clearAll: mockingServer.clearAll,
        port: server.address().port,
    };
};

module.exports = {
    createServer,
    text,
    json,
    html,
};
