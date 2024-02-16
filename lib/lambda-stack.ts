import { Stack, Fn, Duration } from 'aws-cdk-lib';
import { DockerImageFunction, DockerImageCode } from 'aws-cdk-lib/aws-lambda';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

export class LambdaStack extends Stack {

  constructor(scope: Construct, id: string, tag: string, props?: any) {
    super(scope, id, props);

    const ecrRepoName = Fn.importValue("ecr-repo-name");

    new DockerImageFunction(this, "LambdaContainerFunction", {
      code: DockerImageCode.fromEcr(Repository.fromRepositoryName(this, 'LambdaContainerPipeline', ecrRepoName), { tag: tag }),
      memorySize: 1024,
      description: `Function generated on ${new Date().toISOString()}`, // Handling date in TypeScript might differ; see note below
      timeout: Duration.seconds(30),
    });
  }
}