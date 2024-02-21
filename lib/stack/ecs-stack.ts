import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';

interface EcsStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
}

export class EcsStack extends cdk.Stack {
  readonly ecsCluster: ecs.Cluster;

  constructor(scope: cdk.Construct, id: string, props: EcsStackProps) {
    super(scope, id, props);

    // Import the ECR repository name from another stack
    const exportedRepoName = cdk.Fn.importValue(`EcrRepoName`);

    // Create the ECR repository
    const ecrRepository = ecr.Repository.fromRepositoryName(this, 'ECRRepository', exportedRepoName);

    // Create the ECS cluster
    this.ecsCluster = new ecs.Cluster(this, 'ECSCluster', {
        vpc: props.vpc,
    });
  }
}