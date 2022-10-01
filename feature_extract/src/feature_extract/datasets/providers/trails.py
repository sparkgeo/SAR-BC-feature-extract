from osgeo import ogr

from feature_extract.common import get_features_from_layer, register_handler
from feature_extract.datasets.dataset_parameters import DatasetParameters
from feature_extract.datasets.dataset_provider import DatasetProvider
from feature_extract.settings import settings


class Trails(DatasetProvider):
    def __init__(self):
        super().__init__()
        self.dataset_name = "Trails"
        self.layer_name = "trails"
        self.fgb_path = f"{settings.data_access_prefix}/{self.layer_name}.fgb"

    def export_data(self, parameters: DatasetParameters) -> None:
        src_driver = ogr.GetDriverByName("FlatGeobuf")
        src_datasource = src_driver.Open(self.fgb_path)
        src_layer = src_datasource.GetLayerByIndex(0)

        def title_provider(feature: ogr.Feature) -> str:
            name = feature.GetFieldAsString("name")
            type = feature.GetFieldAsString("type")
            suffix = f" ({type})" if type else ""
            return f"{name}{suffix}"

        get_features_from_layer(
            src_layer,
            parameters.result_layer,
            title_provider,
            parameters.lon_min,
            parameters.lat_min,
            parameters.lon_max,
            parameters.lat_max,
        )

    def get_dataset_name(self) -> str:
        return self.dataset_name

    def get_layer_name(self) -> str:
        return self.layer_name

    def get_file_path(self) -> str:
        return self.fgb_path

    def get_ogr_type(self) -> int:
        return ogr.wkbMultiLineString


register_handler(Trails())
