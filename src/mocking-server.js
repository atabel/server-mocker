// @flow
type ParamsBag = {[name: string]: string};

type Request = {
    method: string,
    urlPath: string,
    urlParams: ParamsBag,
    formFields: ParamsBag,
    headers: ParamsBag,
};

type Response = {
    content: string,
    headers: ParamsBag,
    statusCode: number,
};

type RequestPredicate = (req: Request) => boolean;

type ConfiguredResponse = {
    predicate: RequestPredicate,
    response: Response,
    spy?: {
        calls: Array<Request>,
    },
};

const createResponse = (content = '', headers = {}, statusCode = 200): Response => ({
    content,
    headers,
    statusCode,
});

const createJsonResponse = (data: mixed, headers: ParamsBag = {}) =>
    createResponse(JSON.stringify(data), {'content-type': 'application/json', ...headers});

const createTextResponse = (text: string, headers: ParamsBag = {}): Response =>
    createResponse(text, {'content-type': 'text/plain', ...headers});

const createHtmlResponse = (html: string, headers: ParamsBag = {}): Response =>
    createResponse(html, {'content-type': 'text/html', ...headers});

const called = (confResp: ConfiguredResponse) =>
    !!(confResp.spy && confResp.spy.calls && confResp.spy.calls.length);

const calledOnce = (confResp: ConfiguredResponse) =>
    !!(confResp.spy && confResp.spy.calls && confResp.spy.calls.length === 1);

const getCallCount = (confResp: ConfiguredResponse) =>
    confResp.spy && confResp.spy.calls ? confResp.spy.calls.length : 0;

export type MockingServerOptions = {
    onResponseNotFound?: (r: Request) => mixed,
};

const defaultOptions: MockingServerOptions = {
    onResponseNotFound(request) {
        throw `response not found for request ${JSON.stringify(request)}`;
    },
};

const createMockingServer = (options: MockingServerOptions = defaultOptions) => {
    const opts = {...defaultOptions, ...options};
    let configuredResponses: Array<ConfiguredResponse> = [];
    let requests: Array<Request> = [];

    const handle = (request: Request): ?Response => {
        requests.push(request);
        const confResp = configuredResponses.find(({predicate}) => predicate(request));

        if (!confResp) {
            opts.onResponseNotFound(request);
            return;
        }

        const {response, spy} = confResp;

        if (spy) {
            spy.calls.push(request);
        }

        return response;
    };

    const addConfiguredResponse = (
        predicate: RequestPredicate,
        response: Response,
        withSpy = false
    ): ConfiguredResponse => {
        const spy = {calls: []};

        const configuredResponse = {
            predicate,
            response,
            ...(withSpy ? {spy} : {}),
        };

        configuredResponses.unshift(configuredResponse);

        return configuredResponse;
    };

    const clear = (confResp: ConfiguredResponse) => {
        const index = configuredResponses.findIndex(c => c === confResp);
        configuredResponses.splice(index, 1);
    };

    const spy = (confResp: ConfiguredResponse) => ({
        called: () => called(confResp),
        calledOnce: () => calledOnce(confResp),
        getCallCount: () => getCallCount(confResp),
        clear: () => clear(confResp),
    });

    const clearable = (confResp: ConfiguredResponse) => ({
        clear: () => clear(confResp),
    });

    const mock = (predicate: RequestPredicate) => ({
        returns: (response: Response) => spy(addConfiguredResponse(predicate, response, true)),
    });

    const stub = (predicate: RequestPredicate) => ({
        returns: (response: Response) => clearable(addConfiguredResponse(predicate, response)),
    });

    const getRequests = (): Array<Request> => requests;

    const clearAll = () => {
        configuredResponses = [];
        requests = [];
    };

    return {
        handle,
        mock,
        stub,
        getRequests,
        clearAll,
    };
};

module.exports = {
    createMockingServer,
    json: createJsonResponse,
    text: createTextResponse,
    html: createHtmlResponse,
};
