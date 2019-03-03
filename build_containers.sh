#! /usr/bin/env bash
set -o errexit
set -o nounset

CGO_ENABLED=0 GOOS=linux go build -a -ldflags '-extldflags "-static"'

export DOCKER_BUILDKIT=1
docker build -t gitserver -f Dockerfile.gitserver .
docker build -t gitserver-ssh -f Dockerfile.ssh .