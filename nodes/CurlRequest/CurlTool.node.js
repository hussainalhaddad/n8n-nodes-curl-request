"use strict";
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

// Resolve a dot-notation path in an object
function getNestedValue(obj, path) {
  return path.split(".").reduce((acc, key) => (acc != null ? acc[key] : undefined), obj);
}

// Pick only selected fields from an object
function pickFields(obj, fields) {
  const result = {};
  for (const f of fields) {
    const trimmed = f.trim();
    if (trimmed && obj[trimmed] !== undefined) result[trimmed] = obj[trimmed];
  }
  return result;
}

class CurlTool {
  constructor() {
    this.description = {
      displayName: "Curl Tool",
      name: "curlTool",
      icon: "fa:terminal",
      group: ["transform"],
      version: 1,
      description: "Runs curl to make HTTP requests",
      defaults: { name: "Curl Tool" },
      codex: {
        categories: ["AI"],
        subcategories: { AI: ["Tools"] },
        resources: {},
      },
      inputs: [],
      outputs: ["main"],
      usableAsTool: true,
      properties: [
        // -- Request ---------------------------------------------------
        {
          displayName: "Method",
          name: "method",
          type: "options",
          options: [
            { name: "GET", value: "GET" },
            { name: "POST", value: "POST" },
            { name: "PUT", value: "PUT" },
            { name: "PATCH", value: "PATCH" },
            { name: "DELETE", value: "DELETE" },
          ],
          default: "GET",
        },
        {
          displayName: "URL",
          name: "url",
          type: "string",
          default: "",
          required: true,
        },
        // -- Query Parameters ------------------------------------------
        {
          displayName: "Send Query Parameters",
          name: "sendQuery",
          type: "boolean",
          default: false,
        },
        {
          displayName: "Query Parameters",
          name: "queryParameters",
          type: "fixedCollection",
          typeOptions: { multipleValues: true },
          default: {},
          displayOptions: { show: { sendQuery: [true] } },
          options: [
            {
              name: "parameters",
              displayName: "Parameter",
              values: [
                { displayName: "Name", name: "name", type: "string", default: "" },
                { displayName: "Value", name: "value", type: "string", default: "" },
              ],
            },
          ],
        },
        // -- Headers ---------------------------------------------------
        {
          displayName: "Send Headers",
          name: "sendHeaders",
          type: "boolean",
          default: false,
        },
        {
          displayName: "Headers",
          name: "headerParameters",
          type: "fixedCollection",
          typeOptions: { multipleValues: true },
          default: {},
          displayOptions: { show: { sendHeaders: [true] } },
          options: [
            {
              name: "parameters",
              displayName: "Header",
              values: [
                { displayName: "Name", name: "name", type: "string", default: "" },
                { displayName: "Value", name: "value", type: "string", default: "" },
              ],
            },
          ],
        },
        // -- Body ------------------------------------------------------
        {
          displayName: "Send Body",
          name: "sendBody",
          type: "boolean",
          default: false,
        },
        {
          displayName: "Body Content Type",
          name: "bodyContentType",
          type: "options",
          displayOptions: { show: { sendBody: [true] } },
          options: [
            { name: "JSON", value: "json" },
            { name: "Form Urlencoded", value: "form" },
            { name: "Raw", value: "raw" },
          ],
          default: "json",
        },
        {
          displayName: "Body Parameters",
          name: "bodyParameters",
          type: "fixedCollection",
          typeOptions: { multipleValues: true },
          default: {},
          displayOptions: { show: { sendBody: [true], bodyContentType: ["json", "form"] } },
          options: [
            {
              name: "parameters",
              displayName: "Parameter",
              values: [
                { displayName: "Name", name: "name", type: "string", default: "" },
                { displayName: "Value", name: "value", type: "string", default: "" },
              ],
            },
          ],
        },
        {
          displayName: "Raw Body",
          name: "rawBody",
          type: "string",
          default: "",
          typeOptions: { rows: 4 },
          displayOptions: { show: { sendBody: [true], bodyContentType: ["raw"] } },
        },
        // -- Misc ------------------------------------------------------
        {
          displayName: "Extra Flags",
          name: "extraFlags",
          type: "string",
          default: "",
          description: 'Additional curl flags, e.g. "--max-time 10 --insecure"',
        },
        // -- Authentication --------------------------------------------
        {
          displayName: "Authentication",
          name: "authentication",
          type: "options",
          options: [
            { name: "None", value: "none" },
            { name: "Basic Auth", value: "basicAuth" },
            { name: "Bearer Token", value: "bearerToken" },
            { name: "Header Auth", value: "headerAuth" },
            { name: "Query Auth", value: "queryAuth" },
          ],
          default: "none",
        },
        {
          displayName: "Username",
          name: "basicAuthUser",
          type: "string",
          default: "",
          displayOptions: { show: { authentication: ["basicAuth"] } },
        },
        {
          displayName: "Password",
          name: "basicAuthPassword",
          type: "string",
          typeOptions: { password: true },
          default: "",
          displayOptions: { show: { authentication: ["basicAuth"] } },
        },
        {
          displayName: "Token",
          name: "bearerToken",
          type: "string",
          typeOptions: { password: true },
          default: "",
          displayOptions: { show: { authentication: ["bearerToken"] } },
        },
        {
          displayName: "Header Name",
          name: "headerAuthName",
          type: "string",
          default: "",
          displayOptions: { show: { authentication: ["headerAuth"] } },
        },
        {
          displayName: "Header Value",
          name: "headerAuthValue",
          type: "string",
          typeOptions: { password: true },
          default: "",
          displayOptions: { show: { authentication: ["headerAuth"] } },
        },
        {
          displayName: "Query Parameter Name",
          name: "queryAuthName",
          type: "string",
          default: "",
          displayOptions: { show: { authentication: ["queryAuth"] } },
        },
        {
          displayName: "Query Parameter Value",
          name: "queryAuthValue",
          type: "string",
          typeOptions: { password: true },
          default: "",
          displayOptions: { show: { authentication: ["queryAuth"] } },
        },
        // -- Output Optimization ---------------------------------------
        {
          displayName: "Optimize Response",
          name: "optimizeResponse",
          type: "boolean",
          default: false,
        },
        {
          displayName: "Expected Response Type",
          name: "responseType",
          type: "options",
          displayOptions: { show: { optimizeResponse: [true] } },
          options: [
            { name: "JSON", value: "json" },
            { name: "Text", value: "text" },
          ],
          default: "json",
        },
        {
          displayName: "Field Containing Data",
          name: "dataField",
          type: "string",
          default: "",
          description: "Dot-notation path to extract (e.g. data.results). Leave blank for whole response.",
          displayOptions: { show: { optimizeResponse: [true], responseType: ["json"] } },
        },
        {
          displayName: "Include Fields",
          name: "includeFields",
          type: "options",
          displayOptions: { show: { optimizeResponse: [true], responseType: ["json"] } },
          options: [
            { name: "All", value: "all" },
            { name: "Selected", value: "selected" },
            { name: "Except", value: "except" },
          ],
          default: "all",
        },
        {
          displayName: "Fields to Include",
          name: "fieldsToInclude",
          type: "string",
          default: "",
          description: "Comma-separated list of top-level fields to keep",
          displayOptions: { show: { optimizeResponse: [true], responseType: ["json"], includeFields: ["selected"] } },
        },
        {
          displayName: "Fields to Exclude",
          name: "fieldsToExclude",
          type: "string",
          default: "",
          description: "Comma-separated list of top-level fields to remove",
          displayOptions: { show: { optimizeResponse: [true], responseType: ["json"], includeFields: ["except"] } },
        },
      ],
    };
  }

  async execute() {
    const items = this.getInputData();
    const results = [];

    for (let i = 0; i < items.length; i++) {
      const method          = this.getNodeParameter("method", i);
      let   url             = this.getNodeParameter("url", i);
      const sendQuery       = this.getNodeParameter("sendQuery", i);
      const sendHeaders     = this.getNodeParameter("sendHeaders", i);
      const sendBody        = this.getNodeParameter("sendBody", i);
      const extraFlagsRaw   = this.getNodeParameter("extraFlags", i);
      const optimizeResponse = this.getNodeParameter("optimizeResponse", i);

      // Build query string
      if (sendQuery) {
        const qp = this.getNodeParameter("queryParameters.parameters", i, []);
        if (qp.length) {
          const qs = qp.map(p => `${encodeURIComponent(p.name)}=${encodeURIComponent(p.value)}`).join("&");
          url += (url.includes("?") ? "&" : "?") + qs;
        }
      }

      const authentication = this.getNodeParameter("authentication", i);
      const args = ["-s", "-S", "-X", method];

      // Authentication
      if (authentication === "basicAuth") {
        const user = this.getNodeParameter("basicAuthUser", i);
        const pass = this.getNodeParameter("basicAuthPassword", i);
        args.push("-u", `${user}:${pass}`);
      } else if (authentication === "bearerToken") {
        const token = this.getNodeParameter("bearerToken", i);
        args.push("-H", `Authorization: Bearer ${token}`);
      } else if (authentication === "headerAuth") {
        const name = this.getNodeParameter("headerAuthName", i);
        const value = this.getNodeParameter("headerAuthValue", i);
        args.push("-H", `${name}: ${value}`);
      } else if (authentication === "queryAuth") {
        const name = this.getNodeParameter("queryAuthName", i);
        const value = this.getNodeParameter("queryAuthValue", i);
        const qs = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
        url += (url.includes("?") ? "&" : "?") + qs;
      }

      // Headers
      if (sendHeaders) {
        const hp = this.getNodeParameter("headerParameters.parameters", i, []);
        for (const h of hp) {
          if (h.name) args.push("-H", `${h.name}: ${h.value}`);
        }
      }

      // Body
      if (sendBody) {
        const contentType = this.getNodeParameter("bodyContentType", i);
        if (contentType === "raw") {
          args.push("-d", this.getNodeParameter("rawBody", i));
        } else if (contentType === "json") {
          const bp = this.getNodeParameter("bodyParameters.parameters", i, []);
          const obj = {};
          for (const p of bp) obj[p.name] = p.value;
          args.push("-H", "Content-Type: application/json");
          args.push("-d", JSON.stringify(obj));
        } else if (contentType === "form") {
          const bp = this.getNodeParameter("bodyParameters.parameters", i, []);
          const encoded = bp.map(p => `${encodeURIComponent(p.name)}=${encodeURIComponent(p.value)}`).join("&");
          args.push("-H", "Content-Type: application/x-www-form-urlencoded");
          args.push("-d", encoded);
        }
      }

      // Extra flags
      if (extraFlagsRaw) {
        args.push(...extraFlagsRaw.trim().split(/\s+/));
      }

      args.push(url);

      try {
        const { stdout, stderr } = await execFileAsync("curl", args, {
          timeout: 30000,
          maxBuffer: 10 * 1024 * 1024,
        });

        let responseData;

        if (optimizeResponse) {
          const responseType = this.getNodeParameter("responseType", i);

          if (responseType === "text") {
            responseData = { text: stdout };
          } else {
            // Parse JSON
            let parsed;
            try { parsed = JSON.parse(stdout); } catch { parsed = { raw: stdout }; }

            // Extract nested field if specified
            const dataField = this.getNodeParameter("dataField", i);
            if (dataField) {
              parsed = getNestedValue(parsed, dataField) ?? parsed;
            }

            // Filter fields if requested
            const includeFields = this.getNodeParameter("includeFields", i);
            if (includeFields === "selected") {
              const fieldList = this.getNodeParameter("fieldsToInclude", i).split(",").map(f => f.trim()).filter(Boolean);
              if (fieldList.length) {
                parsed = Array.isArray(parsed)
                  ? parsed.map(item => pickFields(item, fieldList))
                  : pickFields(parsed, fieldList);
              }
            } else if (includeFields === "except") {
              const fieldList = this.getNodeParameter("fieldsToExclude", i).split(",").map(f => f.trim()).filter(Boolean);
              if (fieldList.length) {
                const exclude = item => {
                  const result = { ...item };
                  for (const f of fieldList) delete result[f];
                  return result;
                };
                parsed = Array.isArray(parsed) ? parsed.map(exclude) : exclude(parsed);
              }
            }

            responseData = parsed;
          }

          // When optimized, output response directly (no wrapper)
          results.push({ json: Array.isArray(responseData) ? { items: responseData } : responseData });
        } else {
          try { responseData = JSON.parse(stdout); } catch { responseData = { raw: stdout }; }
          results.push({ json: { success: true, url, method, response: responseData, stderr: stderr || null } });
        }

      } catch (err) {
        results.push({ json: { success: false, url, method, error: err.message, stderr: err.stderr || null } });
      }
    }

    return [results];
  }
}

module.exports = { CurlTool };
