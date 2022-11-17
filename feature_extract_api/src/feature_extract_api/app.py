from re import match, sub
from typing import List, Union

from bcrypt import checkpw
from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials

from feature_extract.byte_range_request_parameters import ByteRangeRequestParameters
from feature_extract.common import list_datasets
from feature_extract.datasets.dataset_info import DatasetInfo
from feature_extract.exceptions.unsupported_dataset import UnsupportedDatasetException
from feature_extract.extract_request_parameters import ExtractRequestParameters
from feature_extract.retriever import (
    count_features,
    get_features_file_path,
    get_fgb_bytes,
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


app = FastAPI(docs_url="/")


@app.get("/{dataset}/export/{x_min}/{y_min}/{x_max}/{y_max}", dependencies=[Depends(check_credentials)])
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


@app.get("/{dataset}/count/{x_min}/{y_min}/{x_max}/{y_max}", dependencies=[Depends(check_credentials)])
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


@app.get("/{dataset}/fgb")
async def fgb_proxy(dataset: str, range: Union[str, None] = Header(default=None)) -> StreamingResponse:
    if range is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="range header is required",
        )
    if not match(r"^bytes=\d+\-\d+$", range):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"range header format incorrect. Must be 'bytes=N-M' but is {range}",
        )
    range_start, range_end = sub(r"^bytes=", "", range).split("-")
    range_response = get_fgb_bytes(
        ByteRangeRequestParameters(
            range_start=int(range_start),
            range_end=int(range_end),
            dataset=dataset,
        )
    )
    return StreamingResponse(
        range_response.byte_iterator,
        media_type=range_response.content_type,
        headers={
            "Content-Range": range_response.content_range,
        },
    )


@app.get("/list", dependencies=[Depends(check_credentials)], response_model=List[DatasetInfo])
async def export_types() -> List[DatasetInfo]:
    return list_datasets()


@app.get("/{dataset}/{z}/{x}/{y}", dependencies=[Depends(check_credentials)])
async def xyz_proxy(dataset: str, z: int, x: int, y: int) -> StreamingResponse:
    pass


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
