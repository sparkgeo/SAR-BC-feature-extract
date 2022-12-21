from pydantic import BaseModel, validator


class DatasetRequestParameters(BaseModel):
    dataset: str

    @validator("dataset")
    def normalise_dataset(value: str):
        return value.lower()
