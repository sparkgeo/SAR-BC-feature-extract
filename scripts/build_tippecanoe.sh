#!/bin/bash

pushd $(dirname $0)/..

export tippecanoe_image_name="sar-bc-feature-extract/tippecanoe"
docker build -t ${tippecanoe_image_name} util/tippecanoe
