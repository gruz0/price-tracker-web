.DEFAULT_GOAL := help

NPM := npm
NPM_RUN := ${NPM} run

help: # Show this help
	@egrep -h '\s#\s' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?# "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup: # Setup project
	@${NPM} install

run: # Run dev server
	@${NPM_RUN} dev

lint: # Run lint
	@${NPM_RUN} lint

test: # Run test
	@${NPM_RUN} test:db:prepare
	@${NPM_RUN} test

db-migrate: # Apply available migrations
	@${NPM_RUN} db:migrate

db-seed: # Seed database
	@${NPM_RUN} db:seed

docker-build: # Build Docker image
	docker compose build

docker-build-no-cache:
	docker compose build --no-cache

docker-db-migrate: # Apply available migrations on Dockerized database
	docker compose exec app npm run db:migrate

docker-db-migrate-from-json:
	docker compose exec app npm run db:migrate_from_json

docker-db-seed: # Seed Dockerized database
	docker compose exec app npm run db:seed

docker-cli: # Run dockerized shell
	docker compose exec app sh

docker-up: # Up dockerized app with database
	docker compose up

docker-start-app: # Start dockerized app
	docker compose up -d app

docker-stop-app: # Stop dockerized app
	docker compose stop app

docker-start-database: # Start dockerized database only
	docker compose up -d db

docker-stop-database: # Stop dockerized database only
	docker compose stop db

docker-start-test-database: # Up test database
	docker compose -f docker-compose.test.yml up

docker-stop-test-database: # Stop dockerized database only
	docker compose -f docker-compose.test.yml stop test_db

# NOTE: Make sure ports temporary changed to 3001:3000 in docker-compose.yml
start-nginx:
	./ops/nginx.sh
	open http://localhost:8080/

stop-nginx:
	./ops/stop-nginx.sh
