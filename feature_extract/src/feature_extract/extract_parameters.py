from pydantic import BaseModel, validator


class ExtractParameters(BaseModel):

    lat_min: float
    lat_max: float
    lon_min: float
    lon_max: float
    dataset: str

    @validator("dataset")
    def normalise_dataset(value: str):
        return value.lower()
