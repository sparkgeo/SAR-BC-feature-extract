from abc import ABC, abstractmethod
from os import environ, path
from re import escape, sub

from boto3 import session

from feature_extract.byte_range_response import ByteRangeResponse
from feature_extract.datasets.dataset_parameters import (
    DatasetExportParameters,
    DatasetParameters,
)


class DatasetProvider(ABC):
    def __init__(self):
        self.data_access_prefix = environ["data_access_prefix"]
        self.s3_data_source = self.data_access_prefix.startswith("/vsis3/")
        if self.s3_data_source:
            s3_config = {"service_name": "s3"}
            if "AWS_S3_ENDPOINT" in environ:
                use_https = environ.get("AWS_HTTPS", "YES") != "NO"
                s3_scheme = "https" if use_https else "http"
                s3_config["use_ssl"] = use_https
                s3_config["endpoint_url"] = "{}://{}".format(s3_scheme, environ["AWS_S3_ENDPOINT"])
            self.s3_client = session.Session().client(**s3_config)
            self.bucket_name = "/".join(self.data_access_prefix.split("/")[2:])

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
    def get_file_path(self) -> str:
        pass

    def _get_file_name(self) -> str:
        return sub(rf"^{escape(self.data_access_prefix)}/", "", self.get_file_path())

    def cache_key(self) -> str:
        if self.s3_data_source:
            response = self.s3_client.head_object(Bucket=self.bucket_name, Key=self._get_file_name())
            file_last_modified = response["LastModified"]
            return sub(r"[^\d]", "", str(file_last_modified))
        else:
            return str(path.getmtime(self.get_file_path()))

    def get_bytes(self, range_start: int, range_end: int) -> ByteRangeResponse:
        if self.s3_data_source:
            range_response = self.s3_client.get_object(
                Bucket=self.bucket_name, Key=self._get_file_name(), Range=f"bytes={range_start}-{range_end}"
            )
            return ByteRangeResponse(
                content_range=range_response["ContentRange"],
                content_type=range_response["ContentType"],
                byte_iterator=range_response["Body"].iter_chunks(),
            )
        else:
            raise NotImplementedError("Not yet a compelling need to support range proxying from local data")
