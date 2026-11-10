.PHONY: help setup build test test-standalone lint lint-all clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

setup: ## Enable corepack and install dependencies (run this first)
	corepack enable
	yarn install

build: ## Build all packages
	yarn build

test: ## Run the unit and component tests (no backend needed)
	yarn test

test-standalone: ## Run the standalone tests (needs DRUXT_BASE_URL, a Drupal backend)
	yarn test:standalone

lint: ## Run ESLint
	yarn lint

lint-all: ## Run all lint checks (eslint, prettier, markdownlint, cspell, renovate, knip, audit)
	yarn lint
	yarn lint:format
	yarn lint:md
	yarn lint:cspell
	yarn lint:renovate
	yarn lint:knip
	yarn lint:audit

clean: ## Remove build artifacts
	yarn clean
