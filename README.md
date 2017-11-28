# server-mocker

Mock responses from your API. Useful for testing / development

## Install

If you use nmp:

    npm install --save-dev server-mocker

If you use yarn:

    yarn add --dev server-mocker

## API

### `createServer(options)`

Creates an http(s) server instance where you can mock/stub responses

**Parameters**

- `options`: **Object** 
  - `port`: **number** the server will run in this port
  - `ssl`?: **[Object](https://nodejs.org/api/tls.html#tls_tls_createserver_options_secureconnectionlistener)** you can pase an object with ssl options to use https. When not specified, the server will use http
  - `onResponseNotFound`?: (r: [`Request`](#request)) => `mixed` You can specify a listener to be called when a the server receives a server which doesn't know how to reply to.

**Returns**: [`MockingServer`](#moking-server)

**Examples**
```js
const mockingServer = createServer({port: 5000});
```
with ssl:
```js
const mockingServer = createServer({
    port: 5000,
    ssl: {
       key: fs.readFileSync(__dirname + '/server.key'),
       cert: fs.readFileSync(__dirname + '/server.crt'),
    }
});
```

### `MokingServer`

#### `.stub(predicate)`
Configures a stubbed response for the requests that match the given predicate

**Parameters**
- `predicate`: (r: [`Request`](#request)) => `boolean`

**Returns**: `Object` with key:
* `returns`: ([`Response`](#response)) => [`Stub`](#stub)

**Example**
```js
import {createServer, text} from 'server-mocker';

const mockingServer = createServer({port: 5000});

// A request predicate wich matches when url has the expected params
const withUrlParams = (expectedUrlParams) => (request) =>
    Object.keys(expectedUrlParams).every(paramName => request.urlParams[paramName] === expectedUrlParams[paramName]);

// Stub the server to return the text "pong" when a request with ?message=ping is received
mockingServer.stub(witUrlParams({message: 'ping'})).returns(text('pong'))
```

#### `.mock(predicate)`

Similar to `.stub`, the difference is you can make expectations for received requests

**Parameters**
- `predicate`: (r: [`Request`](#request)) => `boolean`

**Returns**: `Object` with key:
* `returns`: ([`Response`](#response)) => [`Mock`](#stub)

**Example**
```js
const mock = mockingServer.mock(witUrlParams({message: 'ping'})).returns(text('pong'));
```

#### `.clearAll()`

Removes all the stubs and mocks from the server.

**Example**
```js
mockingServer.clearAll();
```

#### `.close()`

Removes all the stubs and mocks from the server and closes the server connection.

**Example**
```js
mockingServer.close();
```

### `Stub`
A Stub (returned by `.stub().returns()` calls) is an object with the method:

#### `.clear()`
Removes the stub from the server

### `Mock`
A Mock (returned by `.mock().returns()` calls) is an object with the methods:

#### `.clear()`
Removes the mock from the server

#### `.called()`
**Returns** `true` when at least one request has been handled by the server matching this mock

#### `.calledOnce()`
**Returns** `true` when one and only one request has been handled by the server matching this mock

#### `.getCallCount()`
**Returns** `number` the number of request handled by the server matching this mock

### Request
<!-- type ParamsBag = {[name: string]: string}; -->
It's an object with these fields:
* `method`: **string** http method (`'GET'`, `'POST'`, `'PUT'`...)
* `urlPath`: **string** the url path, for example `'/about'`
* `urlParams`: **Object** a key-value object with url params
* `formFields`: **Object** a key-value object with form fields
* `headers`: **Object** a key-value object with request headers

### Response
It's an object with these fields:

* `content`: **string** http response content
* `headers`: **Object** a key-value object with request headers
* `statusCode`: **number** http status code (`200`, `404`, `302`...)


### `text(content, [headers])`
Creates a response with content type `'text/plain'` and with the given `content` and optional `headers`

**Parameters**
* `content`: **string**
* `headers`?: **headers** 

**Returns** [`Response`](#response)


### `html(content, [headers])`
Creates a response with content type `'text/html'` and with the given `content` and optional `headers`

**Parameters**
* `content`: **string**
* `headers`?: **headers**

**Returns** [`Response`](#response)


### `json(data, [headers])`
Creates a response with content type `'application/json'` and with the given `data` and optional `headers`

**Parameters**
* `data`: **mixed** this data is json-encoded into response's content
* `headers`?: **headers**

**Returns** [`Response`](#response)
