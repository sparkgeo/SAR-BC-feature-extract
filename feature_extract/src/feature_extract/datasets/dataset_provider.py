from abc import ABC, abstractmethod
from logging import getLogger
from os import path, stat
from re import escape, sub
from typing import Final, List

from boto3 import session

from feature_extract.byte_range_response import ByteRangeResponse
from feature_extract.datasets.dataset_parameters import (
    DatasetExportParameters,
    DatasetParameters,
)
from feature_extract.settings import settings
from feature_extract.vector_tile_request_parameters import VectorTileRequestParameters
from feature_extract.vector_tile_response import VectorTileResponse

logger: Final = getLogger(__file__)


class DatasetProvider(ABC):
    def __init__(self):
        s3_config = {"service_name": "s3"}
        if settings.AWS_S3_ENDPOINT:
            use_https = settings.AWS_HTTPS != "NO"
            s3_scheme = "https" if use_https else "http"
            s3_config["use_ssl"] = use_https
            s3_config["endpoint_url"] = "{}://{}".format(s3_scheme, settings.AWS_S3_ENDPOINT)
        self.s3_client = session.Session().client(**s3_config)
        self.s3_fgb_data_source = settings.fgb_access_prefix.startswith("/vsis3/")
        if self.s3_fgb_data_source:
            self.fgb_bucket_name = "/".join(settings.fgb_access_prefix.split("/")[2:])

    @abstractmethod
    def export_data(self, parameters: DatasetExportParameters) -> None:
        pass

    @abstractmethod
    def count_features(self, parameters: DatasetParameters) -> int:
        pass

    @abstractmethod
    def get_dataset_name(self) -> str:
        pass

    @abstractmethod
    def get_layer_name(self) -> str:
        pass

    @abstractmethod
    def get_fgb_file_path(self) -> str:
        pass

    @abstractmethod
    def get_required_field_names(self) -> List[str]:
        pass

    def _get_fgb_file_name(self) -> str:
        return sub(rf"^{escape(settings.fgb_access_prefix)}/", "", self.get_fgb_file_path())

    def get_fgb_bytes(self, range_start: int, range_end: int) -> ByteRangeResponse:
        if self.s3_fgb_data_source:
            range_response = self.s3_client.get_object(
                Bucket=self.fgb_bucket_name, Key=self._get_fgb_file_name(), Range=f"bytes={range_start}-{range_end}"
            )
            return ByteRangeResponse(
                content_range=range_response["ContentRange"],
                content_type=range_response["ContentType"],
                byte_iterator=range_response["Body"].iter_chunks(),
            )
        else:
            raise NotImplementedError("Not yet a compelling need to support range proxying from local data")

    def _get_mbt_file_name(self) -> str:
        return f"{self.get_layer_name()}.mbtiles"

    def get_vector_tile(self, parameters: VectorTileRequestParameters) -> VectorTileResponse:
        cache_path = path.join(path.dirname(__file__), "cache", self._get_mbt_file_name())
        if path.exists(cache_path):
            local_last_modified = stat(cache_path).st_mtime * 1000
        else:
            local_last_modified = 0

        head_response = self.s3_client.head_object(Bucket=settings.mbt_bucket_name, Key=self._get_mbt_file_name())
        remote_last_modified = sub(r"[^\d]", "", str(head_response["LastModified"]))

        logger.info(f"local last modified: {local_last_modified}, remote: {remote_last_modified}")

        return None

        # mbt_response = self.s3_client.get_object(
        #     Bucket=self.mbt_bucket_name, Key=self._get_mbt_file_name()
        # )
        # return VectorTileResponse(
        #     byte_iterator=tile_response["Body"].iter_chunks(),
        # )
