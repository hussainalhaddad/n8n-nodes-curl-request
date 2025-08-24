const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

class CurlRequest {
    constructor() {
        this.description = {
            displayName: 'cURL Request',
            name: 'curlRequest',
            icon: 'file:curl.svg',
            group: ['transform'],
            version: 1,
            description: 'Send HTTP requests using cURL',
            defaults: {
                name: 'cURL Request',
                color: '#00B4D8',
            },
            inputs: ['main'],
            outputs: ['main'],
            properties: [
                {
                    displayName: 'Method',
                    name: 'method',
                    type: 'options',
                    options: [
                        { name: 'GET', value: 'GET' },
                        { name: 'POST', value: 'POST' },
                        { name: 'PUT', value: 'PUT' },
                        { name: 'DELETE', value: 'DELETE' },
                        { name: 'PATCH', value: 'PATCH' }
                    ],
                    default: 'GET',
                    description: 'The HTTP method to use.'
                },
                {
                    displayName: 'URL',
                    name: 'url',
                    type: 'string',
                    default: '',
                    description: 'The URL for the request.'
                },
                {
                    displayName: 'Send Query Parameters',
                    name: 'sendQuery',
                    type: 'boolean',
                    default: false,
                    description: 'Enable to send query parameters'
                },
                {
                    displayName: 'Query Parameters',
                    name: 'queryParameters',
                    placeholder: 'Add Parameter',
                    type: 'fixedCollection',
                    default: {},
                    typeOptions: { multipleValues: true },
                    description: 'Query parameters to add to the URL',
                    options: [
                        {
                            name: 'parameter',
                            displayName: 'Parameter',
                            values: [
                                { displayName: 'Name', name: 'name', type: 'string', default: '' },
                                { displayName: 'Value', name: 'value', type: 'string', default: '' }
                            ]
                        }
                    ],
                    displayOptions: { show: { sendQuery: [true] } }
                },
                {
                    displayName: 'Send Headers',
                    name: 'sendHeaders',
                    type: 'boolean',
                    default: false,
                    description: 'Enable to send headers'
                },
                {
                    displayName: 'Headers',
                    name: 'headers',
                    placeholder: 'Add Header',
                    type: 'fixedCollection',
                    default: {},
                    typeOptions: { multipleValues: true },
                    description: 'Custom headers to send with the request',
                    options: [
                        {
                            name: 'header',
                            displayName: 'Header',
                            values: [
                                { displayName: 'Name', name: 'name', type: 'string', default: '' },
                                { displayName: 'Value', name: 'value', type: 'string', default: '' }
                            ]
                        }
                    ],
                    displayOptions: { show: { sendHeaders: [true] } }
                },
                {
                    displayName: 'Send Body',
                    name: 'sendBody',
                    type: 'boolean',
                    default: false,
                    description: 'Enable to send body'
                },
                {
                    displayName: 'Body Content Type',
                    name: 'bodyContentType',
                    type: 'options',
                    options: [
                        { name: 'Form Urlencoded', value: 'form-urlencoded' },
                        { name: 'Form-Data', value: 'form-data' },
                        { name: 'JSON', value: 'json' },
                        { name: 'Raw', value: 'raw' },
                        { name: 'n8n Binary File', value: 'binary' }
                    ],
                    default: 'json',
                    description: 'Type of body content',
                    displayOptions: { show: { sendBody: [true] } }
                },
                {
                    displayName: 'Specify Body',
                    name: 'specifyBody',
                    type: 'options',
                    options: [
                        { name: 'Using Fields Below', value: 'fields' },
                        { name: 'Using JSON', value: 'json' }
                    ],
                    default: 'fields',
                    displayOptions: {
                        show: {
                            sendBody: [true],
                            bodyContentType: ['json', 'form-urlencoded', 'form-data', 'raw']
                        }
                    }
                },
                {
                    displayName: 'Body Fields',
                    name: 'bodyFields',
                    placeholder: 'Add Field',
                    type: 'fixedCollection',
                    default: {},
                    typeOptions: { multipleValues: true },
                    options: [
                        {
                            name: 'field',
                            displayName: 'Field',
                            values: [
                                { displayName: 'Name', name: 'name', type: 'string', default: '' },
                                { displayName: 'Value', name: 'value', type: 'string', default: '' }
                            ]
                        }
                    ],
                    displayOptions: {
                        show: {
                            sendBody: [true],
                            specifyBody: ['fields'],
                            bodyContentType: ['json', 'form-urlencoded', 'form-data', 'raw']
                        }
                    }
                },
                {
                    displayName: 'Raw Body',
                    name: 'rawBody',
                    type: 'string',
                    default: '',
                    description: 'Raw body content',
                    typeOptions: { alwaysOpenEditWindow: true },
                    displayOptions: {
                        show: {
                            sendBody: [true],
                            specifyBody: ['json'],
                            bodyContentType: ['raw']
                        }
                    }
                },
                {
                    displayName: 'Authentication',
                    name: 'authentication',
                    type: 'options',
                    options: [
                        { name: 'None', value: 'none' },
                        { name: 'Predefined Credential Type', value: 'predefined' },
                        { name: 'Generic Credential Type', value: 'generic' }
                    ],
                    default: 'none',
                    description: 'Choose authentication method'
                }
            ]
        };
    }

    async execute() {
        const quoteForCurl = (value) => {
            // Escape double quotes inside string and wrap in double quotes for Windows compatibility
            const escaped = value.replace(/"/g, '\\"');
            return `"${escaped}"`;
        };

        const items = this.getInputData();
        const returnData = [];

        for (let i = 0; i < items.length; i++) {
            const method = this.getNodeParameter('method', i, 'GET');
            const url = this.getNodeParameter('url', i, '');
            const sendQuery = this.getNodeParameter('sendQuery', i, false);
            const query = this.getNodeParameter('queryParameters', i, {});
            const sendHeaders = this.getNodeParameter('sendHeaders', i, false);
            const headers = this.getNodeParameter('headers', i, {});
            const sendBody = this.getNodeParameter('sendBody', i, false);
            const bodyContentType = this.getNodeParameter('bodyContentType', i, 'json');
            const specifyBody = this.getNodeParameter('specifyBody', i, 'fields');
            const bodyFields = this.getNodeParameter('bodyFields', i, {});
            const rawBody = this.getNodeParameter('rawBody', i, '');
            const authentication = this.getNodeParameter('authentication', i, 'none');

            // Build query string if enabled
            let urlWithQuery = url;
            if (sendQuery && query.parameter && query.parameter.length > 0) {
                let queryString = '';
                query.parameter.forEach((param, idx) => {
                    queryString += (idx === 0 ? '?' : '&') + encodeURIComponent(param.name) + '=' + encodeURIComponent(param.value);
                });
                urlWithQuery += queryString;
            }

            // Start building curl command
            let curlCommand = `curl -s -X ${method} ${quoteForCurl(urlWithQuery)}`;

            // Headers
            if (sendHeaders && headers.header && headers.header.length > 0) {
                headers.header.forEach(header => {
                    curlCommand += ` -H ${quoteForCurl(`${header.name}: ${header.value}`)}`;
                });
            }

            // Body
            if (sendBody) {
                let bodyData = '';

                if (specifyBody === 'json') {
                    if (bodyContentType === 'raw') {
                        bodyData = rawBody;
                    } else if (bodyContentType === 'json') {
                        if (bodyFields.field && bodyFields.field.length > 0) {
                            // build json object from fields
                            const obj = {};
                            bodyFields.field.forEach(f => {
                                obj[f.name] = f.value;
                            });
                            bodyData = JSON.stringify(obj);
                        } else {
                            bodyData = '{}';
                        }
                    } else if (bodyContentType === 'form-urlencoded' || bodyContentType === 'form-data') {
                        if (bodyFields.field && bodyFields.field.length > 0) {
                            const params = bodyFields.field.map(f => `${encodeURIComponent(f.name)}=${encodeURIComponent(f.value)}`);
                            bodyData = params.join(bodyContentType === 'form-urlencoded' ? '&' : '; ');
                        }
                    }
                } else if (specifyBody === 'fields') {
                    // Using fields only
                    if (bodyFields.field && bodyFields.field.length > 0) {
                        if (bodyContentType === 'json') {
                            const obj = {};
                            bodyFields.field.forEach(f => {
                                obj[f.name] = f.value;
                            });
                            bodyData = JSON.stringify(obj);
                        } else if (bodyContentType === 'form-urlencoded' || bodyContentType === 'form-data') {
                            const params = bodyFields.field.map(f => `${encodeURIComponent(f.name)}=${encodeURIComponent(f.value)}`);
                            bodyData = params.join(bodyContentType === 'form-urlencoded' ? '&' : '; ');
                        } else if (bodyContentType === 'raw') {
                            bodyData = rawBody;
                        }
                    }
                }

                if (bodyData) {
                    // Add content-type header if not already set
                    const contentTypeHeader = (() => {
                        switch(bodyContentType) {
                            case 'json': return 'application/json';
                            case 'form-urlencoded': return 'application/x-www-form-urlencoded';
                            case 'form-data': return 'multipart/form-data';
                            case 'raw': return 'text/plain';
                            default: return '';
                        }
                    })();

                    if (contentTypeHeader && (!sendHeaders || !headers.header.some(h => h.name.toLowerCase() === 'content-type'))) {
                        curlCommand += ` -H ${quoteForCurl(`Content-Type: ${contentTypeHeader}`)}`;
                    }

                    curlCommand += ` -d ${quoteForCurl(bodyData)}`;
                }
            }

            // Authentication (add here if you want to support it in curlCommand)

try {
    const { stdout, stderr } = await execPromise(curlCommand);
    let parsedResponse;
    try {
        parsedResponse = JSON.parse(stdout);
    } catch {
        // If parsing fails, store the raw output
        parsedResponse = { raw_output: stdout };
    }
    // Check if the parsed response is an array
    if (Array.isArray(parsedResponse)) {
        // If it's an array, push its elements directly
        parsedResponse.forEach(item => {
            returnData.push({ json: item });
        });
    } else {
        // Otherwise, push the single object
        returnData.push({ json: parsedResponse });
    }
} catch (error) {
    returnData.push({ json: { error: error.message } });
}
        }

        return [returnData];
    }
}

module.exports = { CurlRequest };