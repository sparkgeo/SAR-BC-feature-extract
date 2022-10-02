from hashlib import md5
from json import dumps
from os import path
from re import IGNORECASE, sub

from osgeo import ogr

from feature_extract.byte_range_parameters import ByteRangeParameters
from feature_extract.byte_range_response import ByteRangeResponse
from feature_extract.common import handlers, result_dir_path, result_layer_name
from feature_extract.datasets.dataset_parameters import (
    DatasetExportParameters,
    DatasetParameters,
)
from feature_extract.exceptions.unsupported_dataset import UnsupportedDatasetException
from feature_extract.extract_parameters import ExtractParameters


def _get_name_for_export(prefix: str, x_min: float, y_min: float, x_max: float, y_max: float) -> str:
    return f"{prefix}-{md5(dumps([x_min, y_min, x_max, y_max]).encode('UTF-8')).hexdigest()}"


def get_features_file_path(
    parameters: ExtractParameters,
) -> str:
    _validate_dataset(parameters.dataset)
    provider = handlers[parameters.dataset].dataset_provider
    result_driver = ogr.GetDriverByName("GeoJSON")
    result_filename_prefix = _get_name_for_export(
        sub(r"[^A-Z0-9\-_]+", "-", parameters.dataset, flags=IGNORECASE).lower(),
        parameters.lon_min,
        parameters.lat_min,
        parameters.lon_max,
        parameters.lat_max,
    )
    result_path = path.join(result_dir_path, f"{result_filename_prefix}.json")
    result_datasource = result_driver.CreateDataSource(result_path)
    result_layer = result_datasource.CreateLayer(result_layer_name, geom_type=handlers[parameters.dataset].feature_type)
    provider.export_data(
        DatasetExportParameters(
            lon_min=parameters.lon_min,
            lon_max=parameters.lon_max,
            lat_min=parameters.lat_min,
            lat_max=parameters.lat_max,
            result_layer=result_layer,
        )
    )

    return result_path


def count_features(
    parameters: ExtractParameters,
) -> int:
    _validate_dataset(parameters.dataset)
    return handlers[parameters.dataset].dataset_provider.count_features(
        DatasetParameters(
            lon_min=parameters.lon_min,
            lon_max=parameters.lon_max,
            lat_min=parameters.lat_min,
            lat_max=parameters.lat_max,
        )
    )


def get_bytes(
    parameters: ByteRangeParameters,
) -> ByteRangeResponse:
    _validate_dataset(parameters.dataset)
    return handlers[parameters.dataset].dataset_provider.get_bytes(
        range_start=parameters.range_start,
        range_end=parameters.range_end,
    )


def _validate_dataset(dataset: str) -> None:
    if dataset not in handlers:
        raise UnsupportedDatasetException(dataset)
