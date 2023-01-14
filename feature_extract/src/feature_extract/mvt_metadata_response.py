from typing import List

from pydantic import BaseModel


class MvtMetadataResponse(BaseModel):
    id: str
    minzoom: int
    maxzoom: int
    fields: List[str]
    colour_hex: str
