from json import loads
from os import remove
from shutil import copyfile

from osgeo import ogr
from pytest import MonkeyPatch
from tests.common import use_test_data_dir

with MonkeyPatch.context() as mp:
    use_test_data_dir(mp)
    from feature_extract.datasets.providers.shelters import Shelters
    from feature_extract.extract_request_parameters import ExtractRequestParameters
    from feature_extract.retriever import count_features, get_features_file_path
    from feature_extract.settings import settings


extract_parameters = ExtractRequestParameters(
    lon_min=101,
    lon_max=102,
    lat_min=-45,
    lat_max=-44,
    dataset=Shelters().get_dataset_name(),
)

test_feature_type = "test feature"
test_features = {
    "enclosed": "POINT (101.1 -44.9)",
    "outside": "POINT (102.1 -43.9)",
}

template_data_path = f"{settings.data_access_prefix}/shelters-template.fgb"
data_path = f"{settings.data_access_prefix}/shelters.fgb"
driver = ogr.GetDriverByName("FlatGeobuf")
datasource = None
layer = None


def setup_function():
    copyfile(template_data_path, data_path)
    global datasource
    datasource = driver.Open(data_path, 1)
    global layer
    layer = datasource.GetLayerByIndex(0)
    for key, value in test_features.items():
        feature = ogr.Feature(layer.GetLayerDefn())
        feature.SetField("name", key)
        shape = ogr.CreateGeometryFromWkt(value)
        feature.SetGeometry(shape)
        layer.CreateFeature(feature)

    assert len(test_features.values()) > 0, "no test features"
    assert layer.GetFeatureCount() == len(test_features.values()), "test setup problem creating features"
    datasource.FlushCache()


def teardown_function():
    global layer
    layer = None
    global datasource
    datasource = None
    remove(data_path)


def test_shelters_count():
    assert count_features(extract_parameters) == 1


def test_shelters_features():
    features_file_path = get_features_file_path(extract_parameters)
    result_driver = ogr.GetDriverByName("GeoJSON")
    result_datasource = result_driver.Open(features_file_path)
    result_layer = result_datasource.GetLayerByIndex(0)

    assert result_layer.GetFeatureCount() == 1, "incorrect number of features returned"

    while result_feature := result_layer.GetNextFeature():
        feature_geometry = result_feature.GetGeometryRef()
        feature_wkt = feature_geometry.ExportToWkt()
        feature_dict = loads(result_feature.ExportToJson())
        title = feature_dict["properties"]["title"]
        if title == "enclosed":
            assert feature_wkt == test_features["enclosed"]
        else:
            raise Exception("Unexpected feature returned")
