import * as pipeline from 'aws-cdk-lib/pipelines';
import * as codepipelineActions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { v4 as uuidv4 } from 'uuid';
import { buildspecBabblebox } from '../buildspec/buildspec-babblebox';
import { Construct } from 'constructs';
import { Stage } from 'aws-cdk-lib';

const imageTag = `latest-${uuidv4().split('-').pop()}`;

export class ApplicationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
  }
}

class ApplicationStage extends Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    new ApplicationStack(this, 'Demo-Lambda1');
  }
}

export class BabbleboxAppPipeline extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const repositoryNames = [
      'babblebox_production_django',
      'babblebox_production_postgres',
      'babblebox_production_traefik',
      'babblebox_production_celeryworker',
      'babblebox_production_celerybeat',
      'babblebox_production_flower',
      'babblebox_production_awscli'
    ];

    // //create ecr repos
    // const ecrRepos = repositoryNames.map(repoName => new ecr.Repository(this, repoName, {
    //   repositoryName: repoName,
    // }));

    const ecrRepos = repositoryNames.map(repoName => ecr.Repository.fromRepositoryName(this, repoName, repoName));

    const ecrRegistry = ecrRepos[0].repositoryArn.split("/")[0];

    const buildSpec = codebuild.BuildSpec.fromObject(buildspecBabblebox);

    const githubRepoCdk = 'shivaam/whisper-pulsar-consumer-cdk';

    const gitHubSourceCdk = pipeline.CodePipelineSource.gitHub(githubRepoCdk, "babbleboxapppipeline", {
      authentication: cdk.SecretValue.secretsManager("github-token"),
    });

    const githubRepo = 'shivaam/babblebox';

    const gitHubSourceApp = pipeline.CodePipelineSource.gitHub(githubRepo, "production-local", {
      authentication: cdk.SecretValue.secretsManager("github-token"),
    });

    const babbleboxPipeline = new pipeline.CodePipeline(this, "ContainerPipeline", {
      selfMutation: true,
      pipelineName: "BabbleboxPipeline",
      synth: new pipeline.ShellStep("Synth", {
        input: gitHubSourceCdk,
        commands: ["npm install -g aws-cdk", "npm install", "cdk synth"],
      }),
    });


    const buildContainerProject = new pipeline.CodeBuildStep("ContainerBuild", {
      buildEnvironment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        privileged: true,
      },
      input: gitHubSourceApp,
      partialBuildSpec: buildSpec,
      commands: [],
      env: {
        ECR_REGISTRY: ecrRegistry,
        AWS_ACCOUNT_ID: this.account,
        IMAGE_TAG:imageTag
      },
      // Configure local cache for Docker layers
      cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER)
    });

    babbleboxPipeline.addStage(new ApplicationStage(this, 'buildAndPush'), {
      pre: [buildContainerProject]
    });
    //Add buildContainerProject stage to the pipeline that just does the build and push to ECR
    babbleboxPipeline.buildPipeline();
    ecrRepos.forEach((repo) => {
      repo.grantPullPush(buildContainerProject.project);
    });


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