import * as pipeline from 'aws-cdk-lib/pipelines';
import * as codepipelineActions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { v4 as uuidv4 } from 'uuid';
import { buildspecBabblebox } from '../buildspec-babblebox';
import { Construct } from 'constructs';

const imageTag = `latest-${uuidv4().split('-').pop()}`;

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

        const ecrRepos = repositoryNames.map(repoName => ecr.Repository.fromRepositoryName(this, repoName, repoName));
        const ecrRegistry = ecrRepos[0].repositoryArn.split("/")[0];

        const buildSpec = codebuild.BuildSpec.fromObject(buildspecBabblebox);

        const githubRepo = 'shivaam/babblebox';

        const gitHubSource = pipeline.CodePipelineSource.gitHub(githubRepo, "production-local", {
        authentication: cdk.SecretValue.secretsManager("github-token"),
        });

        const babbleboxPipeline = new pipeline.CodePipeline(this, "ContainerPipeline", {
          selfMutation: false,
          pipelineName: "BabbleboxPipeline",
          synth: new pipeline.ShellStep("Synth", {
              input: gitHubSource,
              commands: [
              ],
          }),
        });

        const buildContainerProject = new pipeline.CodeBuildStep("ContainerBuild", {
            buildEnvironment: {
              buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
              privileged: true,
            },
            input: gitHubSource,
            partialBuildSpec: buildSpec,
            commands: [],
            env: {
              ECR_REGISTRY: ecrRegistry,
              AWS_ACCOUNT_ID: this.account,
            },
            // Configure local cache for Docker layers
            cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER)
          });

    }
} 