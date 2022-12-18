#!/bin/bash

pushd $(dirname $0)/..

export mbutil_image_name="mbutil"
docker build -t ${mbutil_image_name} util/mbutil