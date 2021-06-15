import { expect as expectCDK, haveResource } from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import * as Project13ABackend from "../lib/project13a-backend-stack";

test("Stack has a Cognito User Pool", () => {
  const app = new cdk.App();
  // WHEN
  const stack = new Project13ABackend.Project13ABackendStack(
    app,
    "MyTestStack"
  );
  // THEN
  expectCDK(stack).to(haveResource("AWS::Cognito::UserPool"));
});

test("Stack has a DynamoDB Table", () => {
  const app = new cdk.App();
  // WHEN
  const stack = new Project13ABackend.Project13ABackendStack(
    app,
    "MyTestStack"
  );
  // THEN
  expectCDK(stack).to(haveResource("AWS::DynamoDB::Table"));
});

test("Stack has a User Pool Web Client", () => {
  const app = new cdk.App();
  // WHEN
  const stack = new Project13ABackend.Project13ABackendStack(
    app,
    "MyTestStack"
  );
  // THEN
  expectCDK(stack).to(haveResource("AWS::Cognito::UserPoolClient"));
});

test("Stack has an AppSync GraphQL API", () => {
  const app = new cdk.App();
  // WHEN
  const stack = new Project13ABackend.Project13ABackendStack(
    app,
    "MyTestStack"
  );
  // THEN
  expectCDK(stack).to(haveResource("AWS::AppSync::GraphQLApi"));
});

test("GraphQL API has a DynamoDB Data Source", () => {
  const app = new cdk.App();
  // WHEN
  const stack = new Project13ABackend.Project13ABackendStack(
    app,
    "MyTestStack"
  );
  // THEN
  expectCDK(stack).to(
    haveResource("AWS::AppSync::DataSource", {
      Type: "AMAZON_DYNAMODB",
    })
  );
});
