#!/bin/bash

pushd $(dirname ${0})/..

USER=""
PASS=""
while [[ "$#" > 0 ]]; do
    case $1 in
    --user)
        USER=$2
    shift; shift;;
    --pass)
        PASS=$2
    shift; shift;;
    *)
        echo "Unknown parameter $1"
        exit 1
        ;;
    esac
done

if [ "$USER" == "" ] | [ "$PASS" == "" ]; then
    echo "--user and --pass parameters are both required"
    exit 2
fi

DCO_COMMON="docker-compose -f docker-compose.yml"   # explicit filename to prevent use of .override
${DCO_COMMON} build

echo
echo "Use the following value for the environment variable creds_hash. 'Single quotes' may be required to disable special characters, depending on how your env is configured."
echo
${DCO_COMMON} run api python -c "import bcrypt; print(bcrypt.hashpw(\"{}:{}\".format(\"$USER\", \"$PASS\").encode(), bcrypt.gensalt()).decode())"
echo