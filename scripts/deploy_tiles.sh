#!/bin/bash

pushd $(dirname ${0})/..

aws s3 sync feature_extract/data/tiles/WHSE_FOREST_TENURE_FTEN_ROAD_SECTION_LINES_SVW s3://spk-sar-bc-public-data/resource-roads
aws s3 sync feature_extract/data/tiles/trails s3://spk-sar-bc-public-data/bvsar/trails
aws s3 sync feature_extract/data/tiles/shelters s3://spk-sar-bc-public-data/bvsar/shelters
