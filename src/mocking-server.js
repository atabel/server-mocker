// @flow
type ParamsBag = {[name: string]: string, ...};

export type Request = {
    method: string,
    urlPath: string,
    urlParams: ParamsBag,
    formFields: ParamsBag | void,
    headers: ParamsBag,
};

export type Response = {
    content: string,
    headers: ParamsBag,
    statusCode: number,
};

type RequestPredicate = (req: Request) => boolean;

type ConfiguredResponse = {
    predicate: RequestPredicate,
    responseHandler: (Request) => Response,
    spy?: {
        calls: Array<Request>,
    },
};

const createResponse = (content = '', headers = {}, statusCode = 200): Response => ({
    content,
    headers,
    statusCode,
});

const createJsonResponse = (data: mixed, headers: ParamsBag = {}): Response =>
    createResponse(JSON.stringify(data), {...headers, 'content-type': 'application/json'});

const createTextResponse = (text: string, headers: ParamsBag = {}): Response =>
    createResponse(text, {...headers, 'content-type': 'text/plain'});

const createHtmlResponse = (html: string, headers: ParamsBag = {}): Response =>
    createResponse(html, {...headers, 'content-type': 'text/html'});

const called = (confResp: ConfiguredResponse) =>
    !!(confResp.spy && confResp.spy.calls && confResp.spy.calls.length);

const calledOnce = (confResp: ConfiguredResponse) =>
    !!(confResp.spy && confResp.spy.calls && confResp.spy.calls.length === 1);

const getCallCount = (confResp: ConfiguredResponse) =>
    confResp.spy && confResp.spy.calls ? confResp.spy.calls.length : 0;

type MockingServerOptions = {
    onResponseNotFound?: (r: Request) => mixed,
};

type MockingServer = {
    handle: (request: Request) => ?Response,
    clearAll: () => void,
    getRequests: () => Array<Request>,
    mock: (
        predicate: RequestPredicate
    ) => {
        returns: (
            response: Response
        ) => {
            called: () => boolean,
            calledOnce: () => boolean,
            clear: () => void,
            getCallCount: () => number,
        },
    },
    mockImplementation: (
        predicate: RequestPredicate,
        implementation: (Request) => Response
    ) => {clear: () => void},
    stub: (
        predicate: RequestPredicate
    ) => {
        returns: (response: Response) => {clear: () => void},
    },
};

const createMockingServer = (options: MockingServerOptions): MockingServer => {
    let configuredResponses: Array<ConfiguredResponse> = [];
    let requests: Array<Request> = [];

    const handle = (request: Request): ?Response => {
        requests.push(request);
        const confResp = configuredResponses.find(({predicate}) => predicate(request));

        if (!confResp) {
            if (options.onResponseNotFound) {
                options.onResponseNotFound(request);
                return;
            }
            throw Error(`response not found for request ${JSON.stringify(request)}`);
        }

        const {responseHandler, spy} = confResp;

        if (spy) {
            spy.calls.push(request);
        }

        return responseHandler(request);
    };

    const addConfiguredResponse = (
        predicate: RequestPredicate,
        responseHandler: (Request) => Response
    ): ConfiguredResponse => {
        const configuredResponse = {
            predicate,
            responseHandler,
        };

        configuredResponses.unshift(configuredResponse);

        return configuredResponse;
    };

    const clear = (confResp: ConfiguredResponse) => {
        const index = configuredResponses.findIndex((c) => c === confResp);
        configuredResponses.splice(index, 1);
    };

    const spy = (confResp: ConfiguredResponse) => {
        confResp.spy = {calls: []};
        return {
            called: () => called(confResp),
            calledOnce: () => calledOnce(confResp),
            getCallCount: () => getCallCount(confResp),
            clear: () => clear(confResp),
        };
    };

    const clearable = (confResp: ConfiguredResponse) => ({
        clear: () => clear(confResp),
    });

    const mock = (predicate: RequestPredicate) => ({
        returns: (response: Response) => spy(addConfiguredResponse(predicate, () => response)),
    });

    const stub = (predicate: RequestPredicate) => ({
        returns: (response: Response) => mockImplementation(predicate, () => response),
    });

    const mockImplementation = (predicate: RequestPredicate, implementation: (Request) => Response) =>
        clearable(addConfiguredResponse(predicate, implementation));

    const getRequests = () => requests;

    const clearAll = () => {
        configuredResponses = [];
        requests = [];
    };

    return {
        handle,
        mock,
        stub,
        mockImplementation,
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
