.PHONY: help setup build dev docs test lint lint-all clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

setup: ## Enable corepack and install dependencies (run this first)
	corepack enable
	yarn install

build: ## Build all packages
	yarn build

dev: ## Start the DruxtSite development server
	yarn example:druxt-site

docs: ## Start the documentation site (druxtjs.org)
	yarn docs:dev

test: ## Run unit tests
	yarn test:unit

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
