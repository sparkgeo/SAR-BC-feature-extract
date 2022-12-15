#!/bin/bash

pushd $(dirname $0)/..

docker build -t tippecanoe util/tippecanoe
