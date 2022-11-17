import re
from json import loads
from os import remove
from shutil import copyfile

from osgeo import ogr
from pytest import MonkeyPatch
from tests.common import use_test_data_dir

with MonkeyPatch.context() as mp:
    use_test_data_dir(mp)
    from feature_extract.datasets.providers.trails import Trails
    from feature_extract.extract_request_parameters import ExtractRequestParameters
    from feature_extract.retriever import count_features, get_features_file_path
    from feature_extract.settings import settings


extract_parameters = ExtractRequestParameters(
    lon_min=101,
    lon_max=102,
    lat_min=-45,
    lat_max=-44,
    dataset=Trails().get_dataset_name(),
)

test_feature_type = "test feature"
test_features = {
    "enclosed": "MULTILINESTRING ((101.1 -44.9, 101.1 -44.1, 101.9 -44.1))",
    "overlapping": "MULTILINESTRING ((101.1 -44.9, 101.1 -44.1, 101.9 -44.1, 102.1 -43.9, 102.1 -43.1, 105.5 -42))",
    "outside": "MULTILINESTRING ((102.1 -43.9, 102.1 -43.1, 105.5 -42))",
}

template_data_path = f"{settings.data_access_prefix}/trails-template.fgb"
data_path = f"{settings.data_access_prefix}/trails.fgb"
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
        feature.SetField("type", test_feature_type)
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


def test_trails_count():
    assert count_features(extract_parameters) == 2


def test_trails_features():
    features_file_path = get_features_file_path(extract_parameters)
    result_driver = ogr.GetDriverByName("GeoJSON")
    result_datasource = result_driver.Open(features_file_path)
    result_layer = result_datasource.GetLayerByIndex(0)

    assert result_layer.GetFeatureCount() == 2, "incorrect number of features returned"

    def matchable_wkt_string(input: str) -> str:
        # OGR will return an input multilinestring as a linestring if it only contains one linestring
        return re.sub(r"\(\(", "(", re.sub(r"\)\)", ")", re.sub(r"(^MULTI|\s)", "", input)))

    while result_feature := result_layer.GetNextFeature():
        feature_geometry = result_feature.GetGeometryRef()
        feature_wkt = matchable_wkt_string(feature_geometry.ExportToWkt())
        feature_dict = loads(result_feature.ExportToJson())
        title = feature_dict["properties"]["title"]
        if title == f"enclosed ({test_feature_type})":
            assert feature_wkt == matchable_wkt_string(test_features["enclosed"])
        elif title == f"overlapping ({test_feature_type})":
            # original geometry will be clipped at export bbox edge
            assert feature_wkt == matchable_wkt_string("LINESTRING (101.1 -44.9, 101.1 -44.1, 101.9 -44.1, 102 -44)")
        else:
            raise Exception("Unexpected feature returned")
