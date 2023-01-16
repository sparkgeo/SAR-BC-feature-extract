from pydantic import BaseModel

from feature_extract.datasets.geometry_type import GeometryType
from feature_extract.mvt_metadata_response import MvtMetadataResponse


class DatasetInfo(BaseModel):
    name: str
    type: GeometryType
    mvt_metadata: MvtMetadataResponse
