COMPOSE_FILE = docker-compose.dev.yml

.PHONY: up down restart debug ps logs help

up:
	docker compose -f $(COMPOSE_FILE) up --build

down:
	docker compose -f $(COMPOSE_FILE) down

restart:
	docker compose -f $(COMPOSE_FILE) down
	docker compose -f $(COMPOSE_FILE) up --build

debug:
	@echo "Starting stack with Node inspector enabled (already configured in compose):"
	@echo "  - backend debug:          localhost:9229"
	@echo "  - uam-backend debug:      localhost:9230"
	@echo "  - thirdparty-backend:     localhost:9231"
	@echo
	@echo "Attach from Cursor/VS Code using the '*: Attach (Docker)' debug configs."
	@echo
	docker compose -f $(COMPOSE_FILE) up --build

ps:
	docker compose -f $(COMPOSE_FILE) ps

logs:
	# Usage: make logs          -> all services
	#        make logs SVC=backend
ifneq ($(SVC),)
	docker compose -f $(COMPOSE_FILE) logs -f $(SVC)
else
	docker compose -f $(COMPOSE_FILE) logs -f
endif

help:
	@echo "AG SaaS Docker shortcuts (using $(COMPOSE_FILE))"
	@echo
	@echo "  make up        - start all services (build + attached)"
	@echo "  make down      - stop and remove all services"
	@echo "  make restart   - restart all services (down + up --build)"
	@echo "  make debug     - start stack and print debug port info"
	@echo "  make ps        - show running containers for this stack"
	@echo "  make logs      - follow logs for all services"
	@echo "  make logs SVC=backend  - follow logs for one service"


