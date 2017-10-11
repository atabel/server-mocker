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
    const server = createMockingServer();
    expect(() => {
        server.handle(ANY_REQUEST);
    }).toThrow();
});
