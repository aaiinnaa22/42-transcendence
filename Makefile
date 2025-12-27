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
# make db-push - apply current Prisma schema to the DB
# make db-reset - drop and recreate DB using Prisma migrate reset
# make docker-prune-all - remove all Docker data (containers, images, cache, volumes)
# make studio - run Prisma Studio on localhost

COMPOSE_FILE=docker-compose.prod.yml

# Prisma Studio configuration
STUDIO_PORT ?= 5555

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
	@echo "Removing project build artifacts and dependencies..."
	@rm -rf backend/node_modules frontend/node_modules
	@rm -rf backend/.turbo frontend/.turbo backend/dist frontend/dist
	@rm -rf backend/.cache frontend/.cache
	@docker system prune -a --volumes -f
	@echo "Pruning all Docker data (containers, images, cache, volumes)..."
	@echo "fclean done."

re: fclean all

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

# database helpers
db-push:
	@echo "Pushing Prisma schema to the database (no migrations)."
	docker compose -f $(COMPOSE_FILE) exec backend npx prisma db push

db-reset:
	@echo "Dropping and recreating database using Prisma migrations (will erase data)."
	@docker compose -f $(COMPOSE_FILE) exec backend npx prisma migrate reset --force
	@echo "Database reset complete."

docker-prune-all:
	@echo "WARNING: removing all Docker data (containers, images, networks, cache, volumes)."
	@docker system prune -a --volumes -f
	@echo "Docker prune complete."

# Prisma Studio
studio:
	@docker compose -f $(COMPOSE_FILE) run --rm --entrypoint "" -p $(STUDIO_PORT):$(STUDIO_PORT) backend npx prisma studio --port $(STUDIO_PORT) --hostname 0.0.0.0

.PHONY: all clean fclean re up down build rebuild rebuild-% logs logs-% reb-logs reb-logs-% db-push db-reset docker-prune-all studio $(SERVICES)
