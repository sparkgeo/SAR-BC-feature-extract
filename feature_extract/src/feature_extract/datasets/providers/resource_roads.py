from typing import Final, List

from osgeo import ogr

from feature_extract.common import (
    count_features_in_layer,
    get_features_from_layer,
    register_handler,
)
from feature_extract.datasets.dataset_parameters import (
    DatasetExportParameters,
    DatasetParameters,
)
from feature_extract.datasets.dataset_provider import DatasetProvider
from feature_extract.settings import settings

TRANSPORT_LINE_ID_FIELD_NAME: Final = "TRANSPORT_LINE_ID"
NAME_FIELD_NAME: Final = "STRUCTURED_NAME_1"
DEACTIVATION_DATE_FIELD_NAME: Final = "DEACTIVATION_DATE"


class ResourceRoads(DatasetProvider):
    def __init__(self):
        super().__init__()
        self.dataset_name = "Resource Roads"
        self.layer_name = "TRANSPORT_LINE"
        self.fgb_path = f"{settings.fgb_access_prefix}/{self.layer_name}.fgb"
        self.driver = ogr.GetDriverByName("FlatGeobuf")

    def export_data(self, parameters: DatasetExportParameters) -> None:
        src_datasource = self.driver.Open(self.fgb_path)
        src_layer = src_datasource.GetLayerByIndex(0)

        def title_provider(feature: ogr.Feature) -> str:
            name_field_value = feature.GetFieldAsString(NAME_FIELD_NAME)
            name = (
                name_field_value
                if name_field_value
                else f"ID {feature.GetFieldAsInteger64(TRANSPORT_LINE_ID_FIELD_NAME)}"
            )
            status = " (deac)" if feature.IsFieldNull(DEACTIVATION_DATE_FIELD_NAME) else ""
            return f"{name}{status}"

        get_features_from_layer(
            src_layer,
            parameters.result_layer,
            title_provider,
            parameters.lon_min,
            parameters.lat_min,
            parameters.lon_max,
            parameters.lat_max,
        )

    def count_features(self, parameters: DatasetParameters) -> int:
        src_datasource = self.driver.Open(self.fgb_path)
        src_layer = src_datasource.GetLayerByIndex(0)
        return count_features_in_layer(
            src_layer,
            parameters.lon_min,
            parameters.lat_min,
            parameters.lon_max,
            parameters.lat_max,
        )

    def get_dataset_name(self) -> str:
        return self.dataset_name

    def get_layer_name(self) -> str:
        return self.layer_name

    def get_fgb_file_path(self) -> str:
        return self.fgb_path

    def get_ogr_type(self) -> int:
        return ogr.wkbMultiLineString

    def get_required_field_names(self) -> List[str]:
        return [TRANSPORT_LINE_ID_FIELD_NAME, NAME_FIELD_NAME, DEACTIVATION_DATE_FIELD_NAME]

    def get_filter_query(self) -> str:
        return "TRANSPORT_LINE_TYPE_CODE IN ('RU', 'RRD', 'RRN', 'RRS')"

    def get_colour_hex(self) -> str:
        return "F3B745"


register_handler(ResourceRoads())
