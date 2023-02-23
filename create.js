import {v1} from "uuid";
import AWS from "aws-sdk";

AWS.config.update({ region: "us-east-1" });
const dynamoDb = new AWS.DynamoDB.DocumentClient();

export const main = async(event, context, callback) => {
  // Request body is passed in as a JSON encoded string in 'event.body'
  const jsonData = {
    body: "{\"content\":\"hello world\",\"attachment\":\"hello.jpg\"}",
    requestContext: {
      "identity": {
        "cognitoIdentityId": "USER-SUB-1234"
      }
    }
  };
  const data = JSON.parse(jsonData.body);

  const params = {
    TableName: "hop_notes",
    // 'Item' contains the attributes of the item to be created
    // - 'userId': user identities are federated through the
    //             Cognito Identity Pool, we will use the identity id
    //             as the user id of the authenticated user
    // - 'noteId': a unique uuid
    // - 'content': parsed from request body
    // - 'attachment': parsed from request body
    // - 'createdAt': current Unix timestamp
    Item: {
      userId: jsonData.requestContext.identity.cognitoIdentityId,
      noteId: v1(),
      content: data.content,
      attachment: data.attachment,
      createdAt: new Date().getTime()
    }
  };

  dynamoDb.put(params, (error, data) => {
    // Set response headers to enable CORS (Cross-Origin Resource Sharing)
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Credentials": true
    };

    // Return status code 500 on error
    if (error) {
      console.log(error);
      const response = {
        statusCode: 500,
        headers: headers,
        body: JSON.stringify({ status: false })
      };
      callback(null, response);
      return;
    }

    // Return status code 200 and the newly created item
    console.log(data, params);
    const response = {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify(params.Item)
    };
    callback(null, response);
  });
}