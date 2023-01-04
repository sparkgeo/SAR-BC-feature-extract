#!/bin/sh

aws s3 sync feature_extract/data/tiles s3://mvt-data --exclude '.gitkeep'
aws s3 sync feature_extract/data/fgb-data s3://fgb-data --exclude '.gitkeep'
