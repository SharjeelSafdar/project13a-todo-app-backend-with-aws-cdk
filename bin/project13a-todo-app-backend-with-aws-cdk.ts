#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { Project13ABackendStack } from "../lib/project13a-backend-stack";
import { Project13aFrontendDeployStack } from "../lib/project13a-frontend-deploy-stack";

const app = new cdk.App();
new Project13ABackendStack(app, "Project13ATodoAppBackendWithAwsCdkStack", {});
new Project13aFrontendDeployStack(app, "Project13ATodoAppFrontendDeploy", {});
