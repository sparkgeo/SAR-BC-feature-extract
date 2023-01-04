#!/bin/sh

set -e

DCO_COMMON="docker-compose -f docker-compose.yml -f docker-compose.test.yml"

${DCO_COMMON} build
# explicitly identify test directories to avoid scanning util dirs
${DCO_COMMON} run api pytest /app/feature_extract/tests
${DCO_COMMON} run api pytest /app/feature_extract_api/tests
