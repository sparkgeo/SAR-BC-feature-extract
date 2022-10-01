from pydantic import BaseModel

from feature_extract.datasets.geometry_type import GeometryType


class DatasetInfo(BaseModel):
    name: str
    type: GeometryType
