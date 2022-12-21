#!/bin/bash

pushd $(dirname ${0})/..

aws s3 cp feature_extract/data/WHSE_FOREST_TENURE_FTEN_ROAD_SECTION_LINES_SVW.fgb s3://fgb-data/
aws s3 cp feature_extract/data/trails.fgb s3://fgb-data/
aws s3 cp feature_extract/data/shelters.fgb s3://fgb-data/
