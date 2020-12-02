//@flow
const supertest = require('supertest');
const {createServer, text, json, html} = require('../index');
const mockingServer = createServer();

const request = supertest(`http://localhost:${mockingServer.port}`);

const withUrlParams = (expectedUrlParams: {...}) => ({urlParams}) =>
    Object.keys(expectedUrlParams).every(
        (paramName) => urlParams[paramName] === expectedUrlParams[paramName]
    );

const withMethod = (expectedMethod) => ({method}) => method === expectedMethod;

const anyRequest = () => true;

beforeEach(() => {
    mockingServer.clearAll();
});

test('Can config the sever port', () => {
    const mockingServer = createServer({port: 6666});
    expect(mockingServer.port).toBe(6666);
    mockingServer.close();
});

test('Can stub requests', (done) => {
    mockingServer.stub(withUrlParams({message: 'ping'})).returns(text('pong'));

    request.get('?message=ping').expect(200, 'pong', done);
});

test('Can spy mocked requests', async () => {
    const pingMock = mockingServer.mock(withUrlParams({message: 'ping'})).returns(text('pong'));
    const pongMock = mockingServer.mock(withUrlParams({message: 'pong'})).returns(text('ping'));

    await request.get('?message=ping');

    expect(pingMock.called()).toBe(true);
    expect(pongMock.called()).toBe(false);
});

test('Can mock with custom implementation', async () => {
    const spy = jest.fn((req) => text(req.urlParams.message));
    const pingMock = mockingServer.mockImplementation(withUrlParams({message: 'ping'}), spy);

    await request.get('?message=ping');

    expect(spy).toHaveBeenCalled();
});

test('allows asserting calledWith using mockImplementation', async () => {
    const spy = jest.fn(() => text('any response text'));
    const pingMock = mockingServer.mockImplementation(anyRequest, (req) => spy(req.urlParams));

    await request.get('?message=ping');

    expect(spy).toHaveBeenCalledWith({message: 'ping'});
});

test('Can stub a json response', (done) => {
    mockingServer.stub(withUrlParams({message: 'ping'})).returns(json({message: 'pong'}));

    request
        .get('?message=ping')
        .expect('content-type', 'application/json')
        .expect(200, {message: 'pong'}, done);
});

test('Can stub a html response', (done) => {
    mockingServer.stub(withUrlParams({message: 'ping'})).returns(html('<body>hello</body>'));

    request.get('?message=ping').expect('content-type', 'text/html').expect(200, '<body>hello</body>', done);
});

test('The last matching stub wins', (done) => {
    mockingServer.stub(withMethod('GET')).returns(text('this loses'));
    mockingServer.stub(withUrlParams({a: 'test'})).returns(text('this wins'));

    request.get('?a=test').expect(200, 'this wins', done);
});

test('Stubs can be removed', async () => {
    const stub1 = mockingServer.stub(withMethod('GET')).returns(text('stub1'));
    const stub2 = mockingServer.stub(withUrlParams({a: 'test'})).returns(text('stub2'));

    await request.get('?a=test').expect(200, 'stub2');
    stub2.clear();
    await request.get('?a=test').expect(200, 'stub1');
});

test('Mocks can be removed', async () => {
    const mock1 = mockingServer.mock(withMethod('GET')).returns(text('mock1'));
    const mock2 = mockingServer.mock(withUrlParams({a: 'test'})).returns(text('mock2'));

    await request.get('?a=test').expect(200, 'mock2');
    mock2.clear();
    await request.get('?a=test').expect(200, 'mock1');
});

test('Requests made can be retrived', async () => {
    mockingServer.mock(withMethod('GET')).returns(text('mock'));

    await request.get('/').expect(200, 'mock');
    expect(mockingServer.getRequests().length).toBe(1);

    await request.get('/').expect(200, 'mock');
    expect(mockingServer.getRequests().length).toBe(2);
});

test('Request POST json request', async () => {
    mockingServer.mock(withMethod('POST')).returns(json({success: true}));

    await request
        .post('/')
        .set('content-type', 'application/json')
        .send({test1: '1', test2: 2})
        .expect(200, {success: true});

    expect(mockingServer.getRequests().length).toBe(1);
    expect(mockingServer.getRequests()[0].formFields).toMatchObject({test1: '1', test2: 2});
});

test('Request POST x-www-form-urlencoded request', async () => {
    mockingServer.mock(withMethod('POST')).returns(json({success: true}));

    await request
        .post('/')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({test1: '1', test2: '2'})
        .expect(200, {success: true});

    expect(mockingServer.getRequests().length).toBe(1);
    expect(mockingServer.getRequests()[0].formFields).toMatchObject({test1: '1', test2: '2'});
});

afterAll(() => {
    mockingServer.close();
});
