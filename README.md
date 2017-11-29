# server-mocker

Mock responses from your API. Useful for testing / development

<!-- TOC depthFrom:2 -->

- [Install](#install)
- [Examples](#examples)
    - [Testing](#testing)
    - [Dev api server](#dev-api-server)
- [API](#api)
    - [`createServer(options)`](#createserveroptions)
    - [`MokingServer`](#mokingserver)
        - [`.stub(predicate)`](#stubpredicate)
        - [`.mock(predicate)`](#mockpredicate)
        - [`.clearAll()`](#clearall)
        - [`.close()`](#close)
    - [`Stub`](#stub)
        - [`.clear()`](#clear)
    - [`Mock`](#mock)
        - [`.clear()`](#clear-1)
        - [`.called()`](#called)
        - [`.calledOnce()`](#calledonce)
        - [`.getCallCount()`](#getcallcount)
    - [Request](#request)
    - [Response](#response)
    - [`text(content, [headers])`](#textcontent-headers)
    - [`html(content, [headers])`](#htmlcontent-headers)
    - [`json(data, [headers])`](#jsondata-headers)

<!-- /TOC -->

## Install

If you use nmp:

    npm install --save-dev server-mocker

If you use yarn:

    yarn add --dev server-mocker

## Examples

### Testing
You have a webapp with the following code:

```js
export const getUserData = (userId) =>
    fetch(`http://localhost:5000/user?id=${userId}`).then(res => res.json());
```

You want to write a test for that code and you need to mock the server response. You can use `server-mocker`

```js
import {getUserData} from '../api';
import {createServer, json} from 'server-mocker';

const mockingServer = createServer({port: 5000});

const requestUser = (expectedUserId) => (request) =>
    request.urlPath === '/user' && urlParams.id === expectedUserId;

test('getUserData', async () => {
    const userId = 'any_user_id';
    const userData = {
        name: 'Abel',
    };

    mockingServer.stub(requestUser(userId)).returns(json(userData));
    
    const userData = await getUserData(userId);

    expect(userData.name).toBe('Abel');
});

```

### Dev api server
You can also use `server-mocker` as a development api server running a small node script:

**dev-api.js**
```js
import {createServer, json} from 'server-mocker';

const mockingServer = createServer({port: 5000});

const requestUser = (request) =>
    request.urlPath === '/user';

mockingServer.stub(user()).returns(json({
    name: 'Abel',
}))
```
    node dev-api.js

In your application you can change your api endpoint depending on `process.env.NODE_ENV`

```js
const API_ENDPOINT = process.env.NODE_ENV === 'production'
    ? 'http://my-real-api.com/'
    : 'http://localhost:5000'

export const getUserData = (userId) =>
    fetch(`${API_ENDPOINT}/user?id=${userId}`).then(res => res.json());
```

## API

### `createServer(options)`

Creates an http(s) server instance where you can mock/stub responses

**Parameters**

- `options`: **Object** 
  - `port`: **number** the server will run in this port
  - `ssl`?: **[Object](https://nodejs.org/api/tls.html#tls_tls_createserver_options_secureconnectionlistener)** you can pase an object with ssl options to use https. When not specified, the server will use http
  - `onResponseNotFound`?: (r: [`Request`](#request)) => `mixed` You can specify a listener to be called when a the server receives a server which doesn't know how to reply to.

**Returns**: [`MockingServer`](#mokingserver)

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
* `returns`: ([`Response`](#response)) => [`Mock`](#mock)

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
