#!/bin/bash

set -e

DCO_COMMON="docker-compose -f docker-compose.yml -f docker-compose.test.yml"

data_sources=("TRANSPORT_LINE" "shelters" "trails")
for data_source in "${data_sources[@]}"; do
    data_dir="./feature_extract/data/tiles/${data_source}"
    metadata_file="${data_dir}/metadata.json"
    mkdir -p "${data_dir}"
    if [ ! -f "${metadata_file}" ]; then
        echo '
            {
                "minzoom": 0,
                "maxzoom": 1,
                "json": "{\"vector_layers\": [{\"fields\": {}}]}"
            }
        ' > "${metadata_file}"
    fi
done

${DCO_COMMON} build
# explicitly identify test directories to avoid scanning util dirs
${DCO_COMMON} run api pytest /app/feature_extract/tests
${DCO_COMMON} run api pytest /app/feature_extract_api/tests
