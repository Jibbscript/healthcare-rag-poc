SHELL := /usr/bin/env bash
COMPOSE := docker compose -f deploy/docker-compose.local.yml

.PHONY: lint typecheck test eval-local cdk-synth-smoke cdk-nag docker-local demo-local demo-local-up demo-local-down demo-local-reset demo-local-logs api-local

lint:
	pnpm lint

typecheck:
	pnpm typecheck

test:
	pnpm test

eval-local:
	pnpm eval:local

cdk-synth-smoke:
	pnpm cdk:synth:smoke

cdk-nag:
	pnpm cdk:nag

docker-local:
	$(COMPOSE) config

demo-local-up:
	$(COMPOSE) up -d

demo-local-down:
	$(COMPOSE) down

demo-local-reset:
	$(COMPOSE) down -v --remove-orphans

demo-local-logs:
	$(COMPOSE) logs -f --tail=200

demo-local:
	pnpm demo-local

api-local:
	pnpm api-local
