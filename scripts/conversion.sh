#!/bin/bash

pushd $(dirname ${0})/..

layers_file=".bvsar-feature-extract-layers"
stack_common="docker compose -f docker-compose.yml -f docker-compose.conversion.yml"
${stack_common} build
${stack_common} run --rm api python -m feature_extract.util.output_layers "/output/${layers_file}"
format=FlatGeobuf

echo "updating tippecanoe dependency"
git submodule init
git submodule update
echo "building tippecanoe"
scripts/build_tippecanoe.sh
echo "building mbutil"
scripts/build_mbutil.sh

IFS=$'\n'
set -f
for layer in $(cat < "/tmp/${layers_file}"); do

    echo
    read -p "Path to source file for layer ${layer} (include filename): " source_file_path
    echo ${source_file_path}
    read -p "Name of source layer for layer ${layer} [${layer}]: " source_layer
    layer_name=${source_layer:-$layer}
    echo ${layer_name}

    input_mount=$(dirname "${source_file_path}")
    input_file=$(basename "${source_file_path}")

    echo "converting ${input_mount}/${input_file} to FlatGeobuf"
    docker run \
        --rm \
        -v "${input_mount}":/input \
        -v "${PWD}/feature_extract/data":/output \
        osgeo/gdal:ubuntu-small-3.5.1 \
        ogr2ogr -f ${format} "/output/${layer}.fgb" "/input/${input_file}" "${layer_name}"

    echo "converting ${PWD}/feature_extract/data/${layer}.fgb to Vector Tile"
    docker run \
        --rm \
        -v "${PWD}/feature_extract/data":/data \
        ${tippecanoe_image} \
        tippecanoe \
            --output="/data/${layer}.mbtiles" \
            --force \
            --drop-densest-as-needed \
            -l ${layer} \
            "/data/${layer}.fgb"

    echo "extracting ${PWD}/feature_extract/data/${layer}.mbtiles to tile files"
    docker run \
        --rm \
        -v "${PWD}/feature_extract/data":/input \
        -v "${PWD}/feature_extract/data/tiles":/output \
        mbutil \
        mb-util \
            --image_format=pbf \
            /input/${layer}.mbtiles \
            /output/${layer}

done
