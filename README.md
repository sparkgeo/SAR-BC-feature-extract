# BVSAR Feature Extract API
API to extract individual feature data from BVSAR data stores.

Provides an interface to count and extract features within a given bounding box, clipped to that bounding box, from a specified dataset.

[![Tests](https://github.com/tomfumb/BVSAR-feature-extract/actions/workflows/ci_actions.yml/badge.svg?branch=main)](https://github.com/tomfumb/BVSAR-feature-extract/actions/workflows/ci_actions.yml)

## Execution
### Environment
The following environment variables are mandatory:
- `src_data_dir`: identifies the parent directory containing all supported datasets. Datasets should not be in sub-directories.
- `creds_hash`: hash of a valid username / password. Execute `scripts/creds.sh --user <username> --pass <password>` to generate a valid hash.

The following environment variables are optional:
- `out_data_dir`: identifies the directory used to store generated datasets, defaults to tmp location.

## Development
Assumes Python >= 3.8.

If no local debugging is required, and all development work is exercised exclusively via automated tests, no additional dependencies are required.
- `scripts/test.sh` to execute tests

### Debugging
If local debugging is required, Poetry and GDAL must also be installed (tested with GDAL 3.5.1)
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
                "src_data_dir": "/home/user/data/BVSAR/feature_extract",
                "creds_hash": "hash"
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