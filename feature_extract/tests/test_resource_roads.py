"""
Resource Roads data is delivered in File GeoDatabase format and OGR cannot edit this data.
Preferable to create test data during test setup and then destroy it, but because of
difficulties creating data use a reduced and stable real dataset instead.
"""

from json import loads

from osgeo import ogr
from pytest import MonkeyPatch
from tests.common import use_test_data_dir

with MonkeyPatch.context() as mp:
    use_test_data_dir(mp)
    from feature_extract.datasets.providers.resource_roads import ResourceRoads
    from feature_extract.extract_request_parameters import ExtractRequestParameters
    from feature_extract.retriever import count_features, get_features_file_path


extract_parameters = ExtractRequestParameters(
    lon_min=-127.7234211789999989,
    lon_max=-127.6789652730000029,
    lat_min=54.8413454440000976,
    lat_max=54.8721005390000016,
    dataset=ResourceRoads().get_dataset_name(),
)


def test_resource_roads_count():
    assert count_features(extract_parameters) == 7


def test_resource_roads_features():
    features_file_path = get_features_file_path(extract_parameters)
    result_driver = ogr.GetDriverByName("GeoJSON")
    result_datasource = result_driver.Open(features_file_path)
    result_layer = result_datasource.GetLayerByIndex(0)
    expected_features = [
        {
            "title": "7552 05",
            "vertices": 197,
        },
        {
            "title": "7552 26",
            "vertices": 2,
        },
        {
            "title": "7552 49",
            "vertices": 45,
        },
        {
            "title": "7552 28",
            "vertices": 22,
        },
        {
            "title": "7552 27",
            "vertices": 6,
        },
        {
            "title": "7552 34",
            "vertices": 100,
        },
        {
            "title": "7552 35",
            "vertices": 2,
        },
    ]
    assert len(expected_features) == result_layer.GetFeatureCount(), "incorrect number of features returned"
    found_feature_count = 0
    while result_feature := result_layer.GetNextFeature():
        feature_dict = loads(result_feature.ExportToJson())
        title = feature_dict["properties"]["title"]
        vertices = len(feature_dict["geometry"]["coordinates"])
        for expected_feature in expected_features:
            if title == expected_feature["title"] and vertices == expected_feature["vertices"]:
                found_feature_count += 1
    assert found_feature_count == len(expected_features), "returned features were not as expected"
