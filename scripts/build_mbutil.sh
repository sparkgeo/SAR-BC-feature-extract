#!/bin/bash

pushd $(dirname $0)/..

docker build -t mb-util util/mbutil