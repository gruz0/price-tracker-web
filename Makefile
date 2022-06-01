.DEFAULT_GOAL := help

NPM := npm
NPM_RUN := ${NPM} run

PROJECT_NAME := crawler-web
USER_ID := $$(id -u)
DOCKER_IMAGE_TAG := gruz0/${PROJECT_NAME}:${USER_ID}

help: # Show this help
	@egrep -h '\s#\s' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?# "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup: # Setup project
	@${NPM} install

run: # Run dev server
	@${NPM_RUN} dev

lint: # Run lint
	@${NPM_RUN} lint

build-docker-image: # Build Docker image
	docker build --no-cache -t ${DOCKER_IMAGE_TAG} --build-arg UID=${USER_ID} .

run-docker-image: # Run Docker image
	docker run -d --name "${PROJECT_NAME}" -it --rm -p 127.0.0.1:3001:3000 --env-file=.env.local -v ${PWD}/data:/app/data -v ${PWD}/public/uploads:/app/public/uploads ${DOCKER_IMAGE_TAG}
