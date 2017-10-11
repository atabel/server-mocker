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

const createMockingServer = () => {
    let configuredResponses: Array<ConfiguredResponse> = [];

    const handle = (request: Request): Response => {
        const confResp = configuredResponses.find(({predicate}) => predicate(request));

        if (!confResp) {
            throw `response not found for request ${JSON.stringify(request)}`;
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

        configuredResponses.push(configuredResponse);

        return configuredResponse;
    };

    const clear = (confResp: ConfiguredResponse) => {
        const index = configuredResponses.findIndex(c => c === confResp);
        configuredResponses.splice(index, 1);
    };

    const spy = (confResp: ConfiguredResponse) => ({
        called: () => called(confResp),
        clear: () => clear(confResp),
    });

    const stub = (confResp: ConfiguredResponse) => ({
        clear: () => clear(confResp),
    });

    const mockForRequest = (predicate: RequestPredicate) => ({
        returns: (response: Response) => spy(addConfiguredResponse(predicate, response, true)),
    });

    const stubForRequest = (predicate: RequestPredicate) => ({
        returns: (response: Response) => stub(addConfiguredResponse(predicate, response)),
    });

    const clearAll = () => {
        configuredResponses = [];
    };

    return {
        handle,
        mockForRequest,
        stubForRequest,
        clearAll,
    };
};

module.exports = {
    createMockingServer,
    json: createJsonResponse,
    text: createTextResponse,
    html: createHtmlResponse,
};
