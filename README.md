# Run all prompt tests

npm run test:prompts

# Run specific feature

npm run test:prompts -- --feature fib

# Show detailed JSON outputs for manual review

npm run test:prompts -- --detailed

docker compose -f docker/cpu/docker-compose.yml up -d
