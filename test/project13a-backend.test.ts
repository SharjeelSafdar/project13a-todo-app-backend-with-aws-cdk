import {
  expect as expectCDK,
  matchTemplate,
  MatchStyle,
} from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import * as Project13ATodoAppBackendWithAwsCdk from "../lib/project13a-backend-stack";

test("Empty Stack", () => {
  const app = new cdk.App();
  // WHEN
  const stack = new Project13ATodoAppBackendWithAwsCdk.Project13ABackendStack(
    app,
    "MyTestStack"
  );
  // THEN
  expectCDK(stack).to(
    matchTemplate(
      {
        Resources: {},
      },
      MatchStyle.EXACT
    )
  );
});
