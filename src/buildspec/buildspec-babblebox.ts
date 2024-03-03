export const buildspecBabblebox = {
    "version":"0.2",
    "env": {
      "secrets-manager": {
        "DOCKERHUB_USERNAME": "dockerhub/username",
        "DOCKERHUB_PASS": "dockerhub/password",
        "GITHUB_TOKEN": "github-token",
      },
      "variables": {
        "DOCKER_BUILDKIT": "1",
        //this wont work as the image tag is not available at the time of build
        "DOCKER_REGISTRY": "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com",
        "IMAGE_TAG": "${IMAGE_TAG}"
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
                    'echo $DOCKER_REGISTRY',
                    'echo $IMAGE_TAG',
                    'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com'
                    ],
        },

        "build" : {
            "commands": [
                    'cd babblebox',
                    'pwd',
                    'echo Building image...',
                    'DOCKER_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com" IMAGE_TAG="${IMAGE_TAG}" docker compose -f production.yml build',
                ],
        },
        "post_build" : {
            "commands": [
                'echo Pushing the Docker images...',
                'DOCKER_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com" IMAGE_TAG="${IMAGE_TAG}" docker compose -f production.yml push',
                'echo Build completed',
                'mkdir tmpbabblebox',
                'cd tmpbabblebox',
                'git clone https://${GITHUB_TOKEN}@github.com/shivaam/babblebox.git',
                'cd babblebox',
                'ls -l',
                'git checkout production-local',
                'cd babblebox',
                'sed -i "s/CODE_XTAG/${IMAGE_TAG}/g" k8s/*',
                'grep -i image k8s/*',
                'git add k8s/',
                'git config --global user.email "test.run@gmail.com"',
                'git config --global user.name "CodeBuild"',
                'git commit -m "updated image tag to ${IMAGE_TAG}"',
                'git push',
            ],
        },
    },
}