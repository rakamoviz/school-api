# Instruction
Execute the following commands to run the API server:

 - npm install
 - API_PORT=3000 node .

The requests to all endpoints in this middleware requires Authorization header set. Using postman, click on the "Authorization" tab, choose "Bearer Token" in the "Type" dropdown.

This middleware does not participate in login; in real deployment this is to be used along an authentication server that provides the login flow and produces the token.

For testing, you can generate the token online, by visiting [https://jwt.io](https://jwt.io/). In the lower-right pane, there is a text field that says "your-256-bit-secret". Type "mysecret" in that field; that's the string we use in the config.js in the code.

Copy the token produced (in the left pane), and paste it in Postman inside the "Token" field inside the "Authentication" tab.