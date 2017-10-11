//@flow
const SERVER_PORT = 6666;
const request = require('supertest')(`http://localhost:${SERVER_PORT}`);
const {createServer, text, json, html} = require('../index');
const mockingServer = createServer({port: SERVER_PORT});

const withUrlParams = (expectedUrlParams: {}) => ({urlParams}) =>
    Object.keys(expectedUrlParams).every(paramName => urlParams[paramName] === expectedUrlParams[paramName]);

const withMethod = expectedMethod => ({method}) => method === expectedMethod;

beforeEach(() => {
    mockingServer.clearAll();
});

test('Can stub requests', done => {
    mockingServer.stubForRequest(withUrlParams({message: 'ping'})).returns(text('pong'));

    request.get('?message=ping').expect(200, 'pong', done);
});

test('Can spy mocked requests', async () => {
    const pingMock = mockingServer.mockForRequest(withUrlParams({message: 'ping'})).returns(text('pong'));
    const pongMock = mockingServer.mockForRequest(withUrlParams({message: 'pong'})).returns(text('ping'));

    await request.get('?message=ping');

    expect(pingMock.called()).toBe(true);
    expect(pongMock.called()).toBe(false);
});

test('Can stub a json response', done => {
    mockingServer.stubForRequest(withUrlParams({message: 'ping'})).returns(json({message: 'pong'}));

    request
        .get('?message=ping')
        .expect('content-type', 'application/json')
        .expect(200, {message: 'pong'}, done);
});

test('Can stub a html response', done => {
    mockingServer.stubForRequest(withUrlParams({message: 'ping'})).returns(html('<body>hello</body>'));

    request
        .get('?message=ping')
        .expect('content-type', 'text/html')
        .expect(200, '<body>hello</body>', done);
});

test('The first matching stub wins', done => {
    mockingServer.stubForRequest(withMethod('GET')).returns(text('this wins'));
    mockingServer.stubForRequest(withUrlParams({a: 'test'})).returns(text('this loses'));

    request.get('?a=test').expect(200, 'this wins', done);
});

test('Stubs can be removed', async () => {
    const stub1 = mockingServer.stubForRequest(withMethod('GET')).returns(text('stub1'));
    const stub2 = mockingServer.stubForRequest(withUrlParams({a: 'test'})).returns(text('stub2'));

    await request.get('?a=test').expect(200, 'stub1');
    stub1.clear();
    await request.get('?a=test').expect(200, 'stub2');
});

test('Mocks can be removed', async () => {
    const mock1 = mockingServer.mockForRequest(withMethod('GET')).returns(text('mock1'));
    const mock2 = mockingServer.mockForRequest(withUrlParams({a: 'test'})).returns(text('mock2'));

    await request.get('?a=test').expect(200, 'mock1');
    mock1.clear();
    await request.get('?a=test').expect(200, 'mock2');
});

afterAll(() => {
    mockingServer.close();
});
