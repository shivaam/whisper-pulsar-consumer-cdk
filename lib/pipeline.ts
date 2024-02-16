import * as cdk from 'aws-cdk-lib/core';
import * as pipelines from 'aws-cdk-lib/pipelines';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { LambdaStack } from './lambda-stack';
import { v4 as uuidv4 } from 'uuid';

import { Stage, Stack, StageProps, StackProps, CfnOutput, SecretValue } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep, CodeBuildStep } from 'aws-cdk-lib/pipelines';
import { buildspec } from './buildspec'; // Adjust the import path as necessary

const imageTag = `latest-${uuidv4().split('-').pop()}`;

class ApplicationStageLambda1 extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    new LambdaStack(this, 'Demo-Lambda1', imageTag );
  }
}

class ApplicationStageLambda2 extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    new LambdaStack(this, 'Demo-Lambda2', imageTag );
  }
}

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const ecrRepo = new ecr.Repository(this, "LambdaContainerPipeline");

    new CfnOutput(this, 'EcrRepoName', {
      value: ecrRepo.repositoryName,
      exportName: "EcrRepoName"
    });

    new CfnOutput(this, 'EcrRepoUri', {
      value: ecrRepo.repositoryUri,
      exportName: "EcrRepoUri"
    });

    const githubRepo = 'shivaam/whisper-pulsar-consumer-cdk';

    const gitHubSource = CodePipelineSource.gitHub(githubRepo, "master", {
      authentication: SecretValue.secretsManager("lambda_container_cdk_pipeline_github", { jsonField: 'github' }),
    });

    // A shell script step that describes a github source code and runs the commands on the source code to build the pipeline.
    // In the shell step we are also building the application code along with the pipeline code.
    // Local install of cdk is not available at the system path so cdk cli wont work. We need to either install it globally or
    // we can use npx cdk synth which will use the local isntalce of the cli
    const pipeline = new CodePipeline(this, "ContainerPipeline", {
      synth: new ShellStep("Synth", {
        input: gitHubSource,
        commands: ["npm install -g aws-cdk", "npm install", "cdk synth"],
      }),
    });

    const buildSpec = codebuild.BuildSpec.fromObject(buildspec);

    const githubAppRepo = 'shivaam/whisper-pulsar-consumer';

    const gitHubAppSource = CodePipelineSource.gitHub(githubAppRepo, "master", {
      authentication: SecretValue.secretsManager("lambda_container_cdk_pipeline_github", { jsonField: 'github' }),
    });

    const buildContainerProject = new CodeBuildStep("ContainerBuild", {
      buildEnvironment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        privileged: true,
      },
      input: gitHubAppSource,
      partialBuildSpec: buildSpec,
      commands: [],
      env: {
        IMAGE_TAG: imageTag,
        AWS_ACCOUNT_ID: this.account,
        IMAGE_REPO_NAME: ecrRepo.repositoryUri,
      },
      // Configure local cache for Docker layers
      cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER)
    });

    pipeline.addStage(new ApplicationStageLambda1(this, 'ContainerCDKPipelineLambdaStage1'), {
      pre: [buildContainerProject],
    });

    pipeline.buildPipeline()
    ecrRepo.grantPullPush(buildContainerProject.project);

    buildContainerProject.project.addToRolePolicy(new iam.PolicyStatement({
      actions: ["ecr:GetAuthorizationToken"],
      resources: ["*"],
    }));
    //allow pulling secrets from secrets manager for docker username/ and passwrod
    buildContainerProject.project.addToRolePolicy(new iam.PolicyStatement({
      actions: ["secretsmanager:GetSecretValue"],
      resources: ["*"],
    }));
  }
}
