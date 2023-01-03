#!/bin/sh

echo "connecting minio client to server"
mc alias set minio ${MINIO_URL} ${MINIO_ACCESS_KEY} ${MINIO_SECRET_KEY}

echo "creating buckets"
mc mb minio/fgb-data
mc mb minio/mbt-data

echo "setting buckets to public"
mc anonymous set public minio/fgb-data
mc anonymous set public minio/mbt-data
