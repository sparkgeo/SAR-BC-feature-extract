from abc import ABC, abstractmethod
from logging import getLogger
from re import escape, sub
from typing import Final, List

from boto3 import session

from feature_extract.bytes_response import BytesResponse
from feature_extract.datasets.dataset_parameters import (
    DatasetExportParameters,
    DatasetParameters,
)
from feature_extract.settings import settings

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

    def get_filter_query(self) -> str:
        return None

    def _get_fgb_file_name(self) -> str:
        return sub(rf"^{escape(settings.fgb_access_prefix)}/", "", self.get_fgb_file_path())

    def get_mbt_bytes(self, z: int, x: int, y: int) -> BytesResponse:
        s3_response = self.s3_client.get_object(
            Bucket=settings.mbt_bucket_name, Key=f"/{self.get_layer_name()}/{z}/{x}/{y}.pbf"
        )
        return BytesResponse(byte_iterator=s3_response["Body"].iter_chunks())
