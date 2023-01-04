from typing import List

from bcrypt import checkpw
from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials

from feature_extract.bytes_request_parameters import BytesRequestParameters
from feature_extract.common import list_datasets
from feature_extract.datasets.dataset_info import DatasetInfo
from feature_extract.exceptions.unsupported_dataset import UnsupportedDatasetException
from feature_extract.extract_request_parameters import ExtractRequestParameters
from feature_extract.retriever import (
    count_features,
    get_features_file_path,
    get_mvt_bytes,
)
from feature_extract_api.settings import settings

auth = HTTPBasic()


def check_credentials(credentials: HTTPBasicCredentials = Depends(auth)):
    if not settings.creds_hash:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="API credentials are not configured",
        )
    if not checkpw(
        f"{credentials.username}:{credentials.password}".encode(),
        settings.creds_hash.encode(),
    ):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)


app = FastAPI(docs_url="/", dependencies=[Depends(check_credentials)])


@app.get("/{dataset}/export/{x_min}/{y_min}/{x_max}/{y_max}")
async def export(dataset: str, x_min: float, y_min: float, x_max: float, y_max: float) -> FileResponse:
    return FileResponse(
        get_features_file_path(
            ExtractRequestParameters(
                lon_min=x_min,
                lon_max=x_max,
                lat_min=y_min,
                lat_max=y_max,
                dataset=dataset,
            )
        ),
        media_type="application/geo+json",
    )


@app.get("/{dataset}/count/{x_min}/{y_min}/{x_max}/{y_max}")
async def count(dataset: str, x_min: float, y_min: float, x_max: float, y_max: float) -> int:
    return count_features(
        ExtractRequestParameters(
            lon_min=x_min,
            lon_max=x_max,
            lat_min=y_min,
            lat_max=y_max,
            dataset=dataset,
        )
    )


@app.get("/{dataset}/mvt/{z}/{x}/{y}")
async def mbt_proxy(dataset: str, z: int, x: int, y: int) -> StreamingResponse:
    tile_response = get_mvt_bytes(
        BytesRequestParameters(
            dataset=dataset,
            z=z,
            x=x,
            y=y,
        )
    )
    return StreamingResponse(
        tile_response.byte_iterator,
        media_type=tile_response.content_type,
    )


@app.get("/list", response_model=List[DatasetInfo])
async def export_types() -> List[DatasetInfo]:
    return list_datasets()


@app.exception_handler(UnsupportedDatasetException)
async def unicorn_exception_handler(_: Request, e: UnsupportedDatasetException):
    return JSONResponse(
        status_code=404,
        content={"message": f"{e} dataset not handled"},
    )


app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
