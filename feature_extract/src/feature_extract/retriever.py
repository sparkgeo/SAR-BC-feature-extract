from hashlib import md5
from json import dumps
from os import path
from re import IGNORECASE, sub

from osgeo import ogr

from feature_extract.byte_range_parameters import ByteRangeParameters
from feature_extract.byte_range_response import ByteRangeResponse
from feature_extract.common import handlers, result_dir_path, result_layer_name
from feature_extract.datasets.dataset_parameters import DatasetParameters
from feature_extract.exceptions.unsupported_dataset import UnsupportedDatasetException
from feature_extract.extract_parameters import ExtractParameters


def _get_name_for_export(prefix: str, cache_key: str, x_min: float, y_min: float, x_max: float, y_max: float) -> str:
    print(f"** cache_key for filename: {cache_key}")
    return f"{prefix}-{cache_key}-{md5(dumps([x_min, y_min, x_max, y_max]).encode('UTF-8')).hexdigest()}"


def get_features_file_path(
    parameters: ExtractParameters,
) -> str:
    _validate_dataset(parameters.dataset)
    provider = handlers[parameters.dataset].dataset_provider
    result_driver = ogr.GetDriverByName("GeoJSON")
    result_filename_prefix = _get_name_for_export(
        sub(r"[^A-Z0-9\-_]+", "-", parameters.dataset, flags=IGNORECASE).lower(),
        provider.cache_key(),
        parameters.lon_min,
        parameters.lat_min,
        parameters.lon_max,
        parameters.lat_max,
    )
    result_filename = f"{result_filename_prefix}.json"
    result_path = path.join(result_dir_path, result_filename)
    print(f"** derived path {result_path} for request")
    if not path.exists(result_path):
        print("** no cache result")
        result_datasource = result_driver.CreateDataSource(result_path)
        result_layer = result_datasource.CreateLayer(
            result_layer_name, geom_type=handlers[parameters.dataset].feature_type
        )
        provider.export_data(
            DatasetParameters(
                lon_min=parameters.lon_min,
                lon_max=parameters.lon_max,
                lat_min=parameters.lat_min,
                lat_max=parameters.lat_max,
                result_layer=result_layer,
            )
        )
    else:
        print("** cache result")

    return result_path


def count_features(
    parameters: ExtractParameters,
) -> int:
    _validate_dataset(parameters.dataset)
    result_driver = ogr.GetDriverByName("Memory")
    result_datasource = result_driver.CreateDataSource("")
    result_layer = result_datasource.CreateLayer(result_layer_name, geom_type=handlers[parameters.dataset].feature_type)
    handlers[parameters.dataset].dataset_provider.export_data(
        DatasetParameters(
            lon_min=parameters.lon_min,
            lon_max=parameters.lon_max,
            lat_min=parameters.lat_min,
            lat_max=parameters.lat_max,
            result_layer=result_layer,
        )
    )

    return result_layer.GetFeatureCount()


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
