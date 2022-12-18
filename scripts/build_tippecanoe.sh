#!/bin/bash

pushd $(dirname $0)/..

export tippecanoe_image_name="tippecanoe"
docker build -t ${tippecanoe_image_name} util/tippecanoe
