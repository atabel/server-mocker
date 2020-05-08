//@flow
const {createMockingServer} = require('../mocking-server');

const ANY_REQUEST = {
    urlPath: '',
    urlParams: {},
    formFields: {},
    method: 'GET',
    headers: {},
};

test('mocking-server throws on unhandled request', () => {
    const server = createMockingServer({});
    expect(() => {
        server.handle(ANY_REQUEST);
    }).toThrow();
});

test('mocking-server can listen on unhandled request', () => {
    let responseNotFound = false;
    const onResponseNotFound = () => {
        responseNotFound = true;
    };

    const server = createMockingServer({onResponseNotFound});

    server.handle(ANY_REQUEST);

    expect(responseNotFound).toBe(true);
});
