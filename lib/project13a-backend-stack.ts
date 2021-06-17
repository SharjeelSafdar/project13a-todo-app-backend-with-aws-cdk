import * as cdk from "@aws-cdk/core";
import * as cognito from "@aws-cdk/aws-cognito";
import * as appsync from "@aws-cdk/aws-appsync";
import * as ddb from "@aws-cdk/aws-dynamodb";

export class Project13ABackendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const todosTable = new ddb.Table(this, "TodosTable", {
      partitionKey: {
        name: "id",
        type: ddb.AttributeType.STRING,
      },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    todosTable.addGlobalSecondaryIndex({
      indexName: "username-index",
      partitionKey: {
        name: "username",
        type: ddb.AttributeType.STRING,
      },
      projectionType: ddb.ProjectionType.ALL,
    });

    const userPool = new cognito.UserPool(this, "P13aUserPool", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: true,
      },
      signInCaseSensitive: true,
      passwordPolicy: {
        minLength: 8,
        requireDigits: true,
        requireLowercase: true,
        requireUppercase: true,
      },
      autoVerify: {
        email: true,
      },
      userVerification: {
        emailStyle: cognito.VerificationEmailStyle.LINK,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      standardAttributes: {
        email: {
          required: true,
          mutable: false,
        },
      },
    });

    const userPoolClient = userPool.addClient("P13aUserPoolClient", {
      authFlows: {
        userPassword: true,
      },
    });

    const domain = userPool.addDomain("P13aUserPoolDomain", {
      cognitoDomain: {
        domainPrefix: "todo-app-p13a",
      },
    });

    const gqlApi = new appsync.GraphqlApi(this, "GraphQlApi", {
      name: "GraphQL-Api",
      schema: appsync.Schema.fromAsset("graphql/schema.gql"),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool,
          },
        },
      },
    });

    const ddbDataSource = gqlApi.addDynamoDbDataSource(
      "DdbDataSource",
      todosTable
    );
    todosTable.grantReadWriteData(ddbDataSource);

    ddbDataSource.createResolver({
      typeName: "Query",
      fieldName: "todos",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version" : "2017-02-28",
          "operation" : "Query",
          "index" : "username-index",
          "query" : {
            "expression": "username = :username",
            "expressionValues" : {
              ":username" : $util.dynamodb.toDynamoDBJson($ctx.identity.username)
            }
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultList(),
    });

    ddbDataSource.createResolver({
      typeName: "Mutation",
      fieldName: "createTodo",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2017-02-28",
          "operation": "PutItem",
          "key": {
            "id": $util.dynamodb.toDynamoDBJson($util.autoId())
          },
          "attributeValues": {
            "username": $util.dynamodb.toDynamoDBJson($ctx.identity.username),
            "status": $util.dynamodb.toDynamoDBJson(false)
            #foreach( $entry in $ctx.args.entrySet() )
              ,"$entry.key": $util.dynamodb.toDynamoDBJson($entry.value)
            #end
          },
          "condition": {
            "expression": "attribute_not_exists(id)"
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    });

    ddbDataSource.createResolver({
      typeName: "Mutation",
      fieldName: "editTodoContent",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2017-02-28",
          "operation": "UpdateItem",
          "key": {
            "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
          },
          "update": {
            "expression": "SET content = :newContent",
            "expressionValues": {
              ":newContent": $util.dynamodb.toDynamoDBJson($ctx.args.newContent)
            }
          },
          "condition": {
            "expression": "username = :user",
            "expressionValues": {
              ":user": $util.dynamodb.toDynamoDBJson($ctx.identity.username)
            }
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    });

    ddbDataSource.createResolver({
      typeName: "Mutation",
      fieldName: "toggleTodoStatus",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2017-02-28",
          "operation": "UpdateItem",
          "key": {
            "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
          },
          "update": {
            "expression": "SET #oldStatus = :newStatus",
            "expressionNames": {
              "#oldStatus": "status"
            },
            "expressionValues": {
              ":newStatus": $util.dynamodb.toDynamoDBJson($ctx.args.newStatus)
            }
          },
          "condition": {
            "expression": "username = :user",
            "expressionValues": {
              ":user": $util.dynamodb.toDynamoDBJson($ctx.identity.username)
            }
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    });

    ddbDataSource.createResolver({
      typeName: "Mutation",
      fieldName: "deleteTodo",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2017-02-28",
          "operation": "DeleteItem",
          "key": {
            "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
          },
         "condition": {
            "expression": "username = :user",
            "expressionValues": {
              ":user": $util.dynamodb.toDynamoDBJson($ctx.identity.username)
            }
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    });

    new cdk.CfnOutput(this, "P13aUserPoolsWebClientId", {
      value: userPoolClient.userPoolClientId,
    });
    new cdk.CfnOutput(this, "p13a_project_region", {
      value: this.region,
    });
    new cdk.CfnOutput(this, "p13a_user_pools_id", {
      value: userPool.userPoolId,
    });

    new cdk.CfnOutput(this, "domain", {
      value: domain.domainName,
    });

    new cdk.CfnOutput(this, "P13aGraphQLApiId", {
      value: gqlApi.apiId,
    });

    cdk.Tags.of(this).add("Project", "P13a-Todo-App-with-AWS");
  }
}
