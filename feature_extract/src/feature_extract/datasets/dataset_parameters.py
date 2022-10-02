from osgeo import ogr
from pydantic import BaseModel


class DatasetParameters(BaseModel):

    lat_min: float
    lat_max: float
    lon_min: float
    lon_max: float


class DatasetExportParameters(DatasetParameters):
    result_layer: ogr.Layer

    class Config:
        arbitrary_types_allowed = True
