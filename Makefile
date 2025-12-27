# COMMANDS:
# make - build and run everything
# make build - build images
# make up - starts containers (detached)
# make down - stop containers
# make backend (frontend, pong) - rebuild + started backend (cached)
# make rebuild - force rebuild all (no cache)
# make rebuild-backend - force rebuild backend (no cache)
# make logs - run all services in the foreground (live logs)
# make logs-backend - run backend in the foreground (live logs)
# make reb-logs - force rebuild of all serbives + logs
# make reb-logs-backend - force rebuild backend (no cache) + logs

COMPOSE_FILE=docker-compose.prod.yml

SERVICES = backend frontend

all: build up
	@echo "Transcendence up and running."

build:
	@echo "Building Docker images..."
	@docker compose -f $(COMPOSE_FILE) build

up:
	@echo "Running containers... (in detached mode)"
	@docker compose -f $(COMPOSE_FILE) up -d

down:
	@echo "Stopping containers..."
	@docker compose -f $(COMPOSE_FILE) down

clean:
	@echo "Removing containers, images and volumes..."
	@docker compose -f $(COMPOSE_FILE) down --rmi all -v
	@docker system prune -f --volumes

fclean: clean
	@echo "Removing everything (same as clean for now)..."

re: fclean all

keygen:
	@echo "Generating self-certificates..."
	@sh generate-selfcert.sh

eval: keygen build up

$(SERVICES):
	@echo "Rebuilding and restarting service: $@"
	@docker compose -f $(COMPOSE_FILE) build $@
	@docker compose -f $(COMPOSE_FILE) up -d $@

#if you wanna force a rebuilt - regardless if changes to a service were made or not
rebuild:
	@echo "Stopping, rebuilding (no cache) and restarting all containers"
	@docker compose -f $(COMPOSE_FILE) down
	@docker compose -f $(COMPOSE_FILE) build --no-cache
	@docker compose -f $(COMPOSE_FILE) up -d --force-recreate

rebuild-%:
	@echo "Stopping container, rebuilding (no cache) and restarting service: $*"
	@docker compose -f $(COMPOSE_FILE) stop $*
	@docker compose -f $(COMPOSE_FILE) build --no-cache $*
	@docker compose -f $(COMPOSE_FILE) up -d --force-recreate $*

# if you wanna see live logs (terminal blocking mode)
logs:
	@echo "Showing live logs for all services"
	@docker compose -f $(COMPOSE_FILE) up --build 2>&1 | cat || true

logs-%:
	@echo "Showing logs for service: $*"
	docker compose -f $(COMPOSE_FILE) up --build $* 2>&1 | cat || true

# force rebuild and starting it with the logs
reb-logs:
	@echo "Force rebuilding (no cache) all services and showing live logs..."
	docker compose -f $(COMPOSE_FILE) down
	docker compose -f $(COMPOSE_FILE) build --no-cache
	docker compose -f $(COMPOSE_FILE) up --force-recreate 2>&1 | cat || true

reb-logs-%:
	@echo "Force rebuilding (no cache) and showing logs for service: $*"
	docker compose -f $(COMPOSE_FILE) stop $*
	docker compose -f $(COMPOSE_FILE) build --no-cache $*
	docker compose -f $(COMPOSE_FILE) up --force-recreate $* 2>&1 | cat || true

.PHONY: all clean fclean re up down build rebuild keygen eval rebuild-% logs logs-% reb-logs reb-logs-% $(SERVICES)
