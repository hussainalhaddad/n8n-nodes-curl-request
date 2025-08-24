# n8n Curl Request Node

This is a custom n8n node that allows you to send HTTP requests using the `cURL` command-line tool. It provides a simple and flexible way to interact with web services and APIs directly within your n8n workflows.

## Features

- **HTTP Methods**: Supports common HTTP methods including GET, POST, PUT, DELETE, and PATCH.
- **Query Parameters**: Easily add and manage URL query parameters.
- **Custom Headers**: Set custom request headers.
- **Request Body**: Send data in various formats:
  - **JSON**
  - **Form URL-encoded**
  - **Form Data**
  - **Raw Text**
- **Error Handling**: Captures cURL execution errors and returns them as a structured JSON object in the output.
- **Automatic Content-Type**: Automatically sets the `Content-Type` header based on the selected body type if not already specified.

  <img width="227" height="182" alt="{39248090-3A75-4FE0-8F0C-7EFD9B97515A}" src="https://github.com/user-attachments/assets/c86a03d3-df6c-437a-8618-ea142a95fc20" />
<img width="1857" height="832" alt="{562CBD5D-FEFC-4B98-9BDD-9AE170C8997D}" src="https://github.com/user-attachments/assets/3f16293d-6a63-4e3f-afe3-3a726b9445e3" />


## Installation

### Prerequisites

- This node requires the `cURL` command-line tool to be installed and accessible in the system's PATH.

### Installation Instructions

1.  **Open your n8n instance's terminal.**
2.  **Navigate to your custom nodes directory.** If you don't have one set up, you can create a new folder:
    ```bash
    mkdir -p ~/.n8n/custom
    cd ~/.n8n/custom
    ```
3.  **Clone this repository:**
    ```bash
    git clone https://github.com/hussainalhaddad/n8n-nodes-curl-request.git curl-request-node
    ```
4.  **Install dependencies:**
    ```bash
    cd curl-request-node
    npm install
    ```
5.  **Restart n8n.** The new node should now be available in your n8n editor under the "transform" group.

## Usage

### Node Options

- **Method**: Select the HTTP method (e.g., GET, POST).
- **URL**: Enter the full URL for the request.
- **Send Query Parameters**: Toggle to add query parameters to the URL.
- **Query Parameters**: Add key-value pairs for query parameters.
- **Send Headers**: Toggle to add custom headers.
- **Headers**: Add key-value pairs for headers.
- **Send Body**: Toggle to send a request body.
- **Body Content Type**: Choose the format for the request body (e.g., JSON, Form-Data).
- **Specify Body**: Decide whether to input the body using fields or raw JSON.
- **Body Fields**: Define key-value pairs for the body.
- **Raw Body**: Enter a raw string for the body content.
- **Authentication**: Choose an authentication method (currently placeholders for future implementation). **(WIP)**

### Example Workflow

A simple workflow to send a POST request with a JSON body to a test API.

1.  Add a **Start** node.
2.  Add a **Curl Request** node.
3.  Configure the **Curl Request** node:
    - **Method**: `POST`
    - **URL**: `https://httpbin.org/post`
    - **Send Body**: `true`
    - **Body Content Type**: `JSON`
    - **Specify Body**: `Using Fields Below`
    - **Body Fields**:
        - **Name**: `message`, **Value**: `Hello, world!`

When the workflow is executed, the **Curl Request** node will send a POST request and the output will contain the response from the API, including the data you sent.
