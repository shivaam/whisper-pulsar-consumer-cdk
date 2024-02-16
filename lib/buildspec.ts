export const buildspec = {
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
        "install" : {
            "runtime-versions": {
                    "python": 3.8
            },
        },

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
                    'echo Building image...',
                    'echo $IMAGE_REPO_NAME',
                    'echo $IMAGE_TAG',
                    'docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .',
                    'docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $IMAGE_REPO_NAME:$IMAGE_TAG',
            ],
        },

        "post_build" : {
            "commands": [
                    'echo Pushing the Docker images...',
                    'docker push $IMAGE_REPO_NAME:$IMAGE_TAG',
                    'echo Build completed',
            ],
        },
    },
}