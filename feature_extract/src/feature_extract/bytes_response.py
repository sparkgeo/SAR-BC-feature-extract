from dataclasses import dataclass
from typing import Iterator


@dataclass
class BytesResponse:
    byte_iterator: Iterator[bytes]
    content_type: str
