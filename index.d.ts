declare module 'server-mocker' {
    type ParamsBag = {[name: string]: string};
    type RequestPredicate = (req: Request) => boolean;

    type Options = {
        port?: number;
        ssl?: Object;
        onResponseNotFound?: (r: Request) => mixed;
    };

    declare export type Request = {
        method: string;
        urlPath: string;
        urlParams: ParamsBag;
        formFields: ParamsBag;
        headers: ParamsBag;
    };

    declare export type Response = {
        content: string;
        headers: ParamsBag;
        statusCode: number;
    };


    declare export function createServer(
        opts: Options
    ): {
        port: number,
        clearAll: () => void,
        close: () => Promise<void>,
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
            implementation: (request: Request) => Response
        ) => {clear: () => void},
        stub: (
            predicate: RequestPredicate
        ) => {
            returns: (response: Response) => {clear: () => void},
        },
    };
    declare export function html(html: string, headers?: ParamsBag): Response;
    declare export function json(data: mixed, headers?: ParamsBag): Response;
    declare export function text(text: string, headers?: ParamsBag): Response;
}
