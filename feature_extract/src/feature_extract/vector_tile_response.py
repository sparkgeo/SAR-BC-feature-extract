from dataclasses import dataclass
from typing import Iterator


@dataclass
class VectorTileResponse:
    byte_iterator: Iterator[bytes]
