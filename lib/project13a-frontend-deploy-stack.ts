import * as cdk from "@aws-cdk/core";
import * as codePipeline from "@aws-cdk/aws-codepipeline";
import * as codePipelineActions from "@aws-cdk/aws-codepipeline-actions";
import * as codeBuild from "@aws-cdk/aws-codebuild";
import * as s3 from "@aws-cdk/aws-s3";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as origins from "@aws-cdk/aws-cloudfront-origins";
import * as iam from "@aws-cdk/aws-iam";

export class Project13aFrontendDeployStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const p13aFrontendDeployPipeline = new codePipeline.Pipeline(
      this,
      "P13aFrontendPipeline",
      {
        pipelineName: "P13aDeployFrontendPipeline",
        crossAccountKeys: false,
        restartExecutionOnUpdate: true,
      }
    );

    const sourceCodeArtifact = new codePipeline.Artifact("SourceCode");
    const builtAppArtifact = new codePipeline.Artifact("BuiltApp");

    const p13aBucketForFrontendAssets = new s3.Bucket(
      this,
      "P13aBucketForFrontendAssets",
      {
        bucketName: "p13a-bucket-for-frontend-assets",
        versioned: true,
        autoDeleteObjects: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        websiteIndexDocument: "index.html",
        publicReadAccess: true,
      }
    );

    const p13aDistribution = new cloudfront.Distribution(
      this,
      "P13aFrontendDist",
      {
        defaultBehavior: {
          origin: new origins.S3Origin(p13aBucketForFrontendAssets),
        },
      }
    );

    new cdk.CfnOutput(this, "CloudFrontUrl", {
      value: p13aDistribution.domainName,
    });

    p13aFrontendDeployPipeline.addStage({
      stageName: "GetSourceCode",
      actions: [
        new codePipelineActions.GitHubSourceAction({
          actionName: "CheckoutGithubSuurce",
          owner: "SharjeelSafdar",
          repo: "project13a-serverless-jamstack-todo-app-with-aws-cdk",
          branch: "main",
          oauthToken: cdk.SecretValue.secretsManager(
            "arn:aws:secretsmanager:us-east-2:731540390537:secret:GithubToken-cY2y6b"
          ),
          output: sourceCodeArtifact,
        }),
      ],
    });

    const buildProject = new codeBuild.PipelineProject(this, "BuildCdkStack", {
      projectName: "BuildCdkStack",
      buildSpec: codeBuild.BuildSpec.fromObject({
        version: "0.2",
        phases: {
          install: {
            "runtime-versions": {
              nodejs: 12,
            },
            commands: ["npm i -g gatsby yarn", "yarn"],
          },
          build: {
            commands: ["gatsby build"],
          },
        },
        artifacts: {
          "base-directory": "./public",
          files: ["**/*"],
        },
      }),
      environment: {
        buildImage: codeBuild.LinuxBuildImage.STANDARD_3_0,
      },
    });

    buildProject.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["s3:*"],
        resources: [p13aBucketForFrontendAssets.bucketArn],
      })
    );

    p13aFrontendDeployPipeline.addStage({
      stageName: "BuildApp",
      actions: [
        new codePipelineActions.CodeBuildAction({
          actionName: "BuildApp",
          project: buildProject,
          input: sourceCodeArtifact,
          outputs: [builtAppArtifact],
        }),
      ],
    });

    p13aFrontendDeployPipeline.addStage({
      stageName: "DeployGatsbyApp",
      actions: [
        new codePipelineActions.S3DeployAction({
          actionName: "DeployGatsbyAppToS3Bucket",
          input: builtAppArtifact,
          bucket: p13aBucketForFrontendAssets,
        }),
      ],
    });

    cdk.Tags.of(this).add("Project", "P13a-Todo-App-with-AWS");
  }
}
