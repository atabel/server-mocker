declare module 'server-mocker' {
    type ParamsBag = {[name: string]: string};
    type RequestPredicate = (req: Request) => boolean;

    type Options = {
        port?: number;
        ssl?: Object;
        onResponseNotFound?: (r: Request) => mixed;
    };

    declare type Request = {
        method: string;
        urlPath: string;
        urlParams: ParamsBag;
        formFields: ParamsBag | void;
        headers: ParamsBag;
    };

    declare type Response = {
        content: string;
        headers: ParamsBag;
        statusCode: number;
    };

    declare function createServer(
        opts: Options
    ): {
        port: number;
        clearAll: () => void;
        close: () => Promise<void>;
        getRequests: () => Array<Request>;
        mock: (
            predicate: RequestPredicate
        ) => {
            returns: (
                response: Response
            ) => {
                called: () => boolean;
                calledOnce: () => boolean;
                clear: () => void;
                getCallCount: () => number;
            };
        };
        mockImplementation: (
            predicate: RequestPredicate,
            implementation: (request: Request) => Response
        ) => {clear: () => void};
        stub: (
            predicate: RequestPredicate
        ) => {
            returns: (response: Response) => {clear: () => void};
        };
    };
    declare function html(html: string, headers?: ParamsBag): Response;
    declare function json(data: mixed, headers?: ParamsBag): Response;
    declare function text(text: string, headers?: ParamsBag): Response;
}
