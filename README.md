# BVSAR Feature Extract API
API to extract individual feature data from BVSAR data stores.

Provides an interface to count and extract features within a given bounding box, clipped to that bounding box, from a specified dataset.

[![Tests](https://github.com/tomfumb/BVSAR-feature-extract/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/tomfumb/BVSAR-feature-extract/actions/workflows/tests.yml)

## Execution
### Environment
The following environment variables are mandatory:
- `creds_hash`: hash of a valid username / password. Execute `scripts/creds.sh --user <username> --pass <password>` to generate a valid hash.
- `data_access_prefix`: path to directory containing FlatGeobuf files. Can be S3 with `/vsis3/` prefix or local path. Files should not be in sub-directories.

The following environment variables are optional:
- `out_data_dir`: identifies the directory used to store generated datasets, defaults to tmp location.

## Development
Assumes Python >= 3.8.
Requires jq

If no local debugging is required, and all development work is exercised exclusively via automated tests, no additional dependencies are required.
- `scripts/test.sh` to execute tests

### Debugging
If local debugging is required, GDAL must also be installed (tested with GDAL 3.5.1)
- `scripts/local.sh` to install dependencies and configure pre-commit hooks

#### Sample .vscode/launch.json
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "api",
            "type": "python",
            "request": "launch",
            "module": "uvicorn",
            "args": [
                "feature_extract_api.app:app",
                "--host", "0.0.0.0",
                "--port", "8123",
                "--reload"
            ],
            "env": {
                "creds_hash": "$2b$12$85MauznOKD7Y7fi2oTDSw.HNMu5pnWvyqpd/6/WPVhMjafa3ztkTu",
                "fgb_access_prefix": "/vsis3/fgb-data",
                "mvt_bucket_name": "tiles",
                "AWS_S3_ENDPOINT": "s3local",
                "AWS_HTTPS": "NO",
                "AWS_VIRTUAL_HOSTING": "FALSE"
            },
            "console": "integratedTerminal",
            "justMyCode": false
        }, {
            "name": "pytest",
            "type": "python",
            "request": "launch",
            "module": "pytest",
            "console": "integratedTerminal",
            "justMyCode": false
        }
    ]
}
```