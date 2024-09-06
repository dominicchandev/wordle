REDIS_PORT=6379
REDIS_VERSION=7.4.0

redis:
	docker run --name world-redis -p 6379:${REDIS_PORT} -d redis:${REDIS_VERSION}

server:
	ts-node server/server.ts

client:
	ts-node client/client.ts