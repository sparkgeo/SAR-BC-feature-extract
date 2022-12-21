from dataclasses import dataclass
from typing import Iterator


@dataclass
class ByteRangeResponse:
    content_range: str
    content_type: str
    byte_iterator: Iterator[bytes]
