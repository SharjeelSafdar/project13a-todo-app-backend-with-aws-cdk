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
      emailSettings: {
        from: "miansharjeelsafdar@gmail.com",
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
      // oAuth: {

      // }
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
  }
}