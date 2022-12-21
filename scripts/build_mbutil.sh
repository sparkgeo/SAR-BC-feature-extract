#!/bin/bash

pushd $(dirname $0)/..

export mbutil_image_name="sar-bc-feature-extract/mbutil"
docker build -t ${mbutil_image_name} util/mbutil