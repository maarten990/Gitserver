#! /usr/bin/env bash
set -o errexit
set -o nounset

export DOCKER_BUILDKIT=1
docker build -t gitserver -f Dockerfile.gitserver .
docker build -t gitserver-ssh -f Dockerfile.ssh .