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
. scripts/build_tippecanoe.sh
echo "building mbutil"
. scripts/build_mbutil.sh

arr=()
while IFS='' read -r line; do
   arr+=("$line")
done < <(jq -r 'keys[]' /tmp/${layers_file})

for layer_name in "${arr[@]}"; do
    echo
    read -p "Path to source file for layer ${layer_name} (include filename or .gdb directory if File GeoDatabase): " source_file_path
    echo ${source_file_path}

    input_mount=$(dirname "${source_file_path}")
    input_file=$(basename "${source_file_path}")

    echo "finding geometry column in ${input_mount}/${input_file}"
    geom_column=$(\
        docker run \
            --rm \
            -v "${input_mount}":/input \
            osgeo/gdal:ubuntu-small-3.5.1 \
            ogrinfo \
                -so \
                "/input/${input_file}" \
                "${layer_name}" \
        | grep "Geometry Column" | sed -E 's/.+=[[:space:]]+(.+)/\1/g')

    echo "finding field names in ${input_mount}/${input_file}"
    field_names=$(jq --arg layer_name "${layer_name}" -r '.[$layer_name].field_names | join(", ")' "/tmp/${layers_file}")
    filter_query=$(jq --arg layer_name "${layer_name}" -r '.[$layer_name].filter_query // ""' "/tmp/${layers_file}")

    echo "converting ${input_mount}/${input_file} to FlatGeobuf"
    where_clause=""
    if [ "${filter_query}" != "" ]; then
        where_clause=" WHERE ${filter_query}"
    fi
    mkdir -p feature_extract/data/fgb-data
    docker run \
        --rm \
        -v "${input_mount}":/input \
        -v "${PWD}/feature_extract/data":/output \
        osgeo/gdal:ubuntu-small-3.5.1 \
        ogr2ogr \
            -f ${format} \
            -dialect SQLite \
            -sql "SELECT ${field_names}, ${geom_column} FROM ${layer_name}${where_clause}" \
            -t_srs "EPSG:4326" \
            "/output/fgb-data/${layer_name}.fgb" \
            "/input/${input_file}"

    echo "converting ${input_mount}/${input_file} to Vector Tile"
    docker run \
        --rm \
        -v "${PWD}/feature_extract/data":/data \
        ${tippecanoe_image_name} \
        tippecanoe \
            --output="/data/${layer_name}.mbtiles" \
            --force \
            --drop-densest-as-needed \
            --no-tile-compression \
            -l ${layer_name} \
            "/data/fgb-data/${layer_name}.fgb"

    echo "extracting ${PWD}/feature_extract/data/${llayer_nameayer}.mbtiles to tile files"
    mkdir -p feature_extract/data/tiles
    rm -rf feature_extract/data/tiles/${layer_name}
    docker run \
        --rm \
        -v "${PWD}/feature_extract/data":/input \
        -v "${PWD}/feature_extract/data/tiles":/output \
        ${mbutil_image_name} \
        mb-util \
            --image_format=pbf \
            /input/${layer_name}.mbtiles \
            /output/${layer_name}

done
