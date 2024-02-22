export const buildspecBabblebox = {
    "version":"0.2",
    "env": {
      "secrets-manager": {
        "DOCKERHUB_USERNAME": "dockerhub/username",
        "DOCKERHUB_PASS": "dockerhub/password",
      },
      "variables": {
        "DOCKER_BUILDKIT": "1"
      }
    },
    "phases": {
        "pre_build" : {
            "commands": [
                    'echo Logging in to Docker Hub...',
                    'docker login --username $DOCKERHUB_USERNAME --password $DOCKERHUB_PASS',
                    'echo Logging in to Amazon ECR...',
                    'echo $AWS_DEFAULT_REGION',
                    'echo $AWS_ACCOUNT_ID',
                    'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com'
                    ],
        },

        "build" : {
            "commands": [
                    'cd babblebox',
                    'pwd',
                    'echo Building image...',
                    'DOCKER_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com" docker compose -f production.yml build',
                ],
        },

        "post_build" : {
            "commands": [
                'echo Pushing the Docker images...',
                'DOCKER_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com" docker compose -f production.yml push',
                'echo Build completed',
            ],
        },
    },
}