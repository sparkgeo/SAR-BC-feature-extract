from pydantic import BaseModel, validator


class ByteRangeParameters(BaseModel):

    range_start: int
    range_end: int
    dataset: str

    @validator("dataset")
    def normalise_dataset(value: str):
        return value.lower()
