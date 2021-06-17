# Backend for Project 13A Todo App with AWS CDK

This AWS CDK App deploys the backend infrastructure for [Project 13A](https://github.com/SharjeelSafdar/project13a-serverless-jamstack-todo-app-with-aws-cdk). The app consists of two stacks.

## Stack 1: AppSync GraphQL API and DynamoDB Table

Stack 1 contanis the AWS services used by the web client. It has the following constructs:

- A Cognito User Pool for authenticating users
- A User Pool web client to connect the User Pool with the client
- A DynamoDB Table to contain the todos saved by the users
- An AppSync GraphQL API to access the todos in the Table

## Stack 2: CI/CD Pipeline for Frontend

Stack 2 contains a CI/CD pipeline to deploy frontend client. It has the following constructs:

- A Code Build project to build the Gatsby web app
- A S3 Bucket with public access to store the static assets of Gatsby web app
- A Cloud Front Distribution to serve the static assets through a CDN
- A Code Pipeline with the following three stages:
  1. The first stage gets the source code from the GitHub repo
  2. The second stage builds the Gatsby app using the Code Build project
  3. The third stage deploys the static web assets to the S3 Bucket

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template
