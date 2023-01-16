from abc import ABC, abstractmethod
from json import loads
from logging import getLogger
from re import escape, sub
from typing import Final, List

from boto3 import session
from botocore.exceptions import ClientError

from feature_extract.bytes_response import BytesResponse
from feature_extract.datasets.dataset_parameters import (
    DatasetExportParameters,
    DatasetParameters,
)
from feature_extract.mvt_metadata_response import MvtMetadataResponse
from feature_extract.settings import settings

logger: Final = getLogger(__file__)


class DatasetProvider(ABC):
    def __init__(self):
        s3_config = {"service_name": "s3"}
        if settings.s3_endpoint:
            s3_config["use_ssl"] = False
            s3_config["endpoint_url"] = f"http://{settings.s3_endpoint}"
        self.s3_client = session.Session().client(**s3_config)

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
    def get_ogr_type(self) -> int:
        pass

    @abstractmethod
    def get_required_field_names(self) -> List[str]:
        pass

    def get_filter_query(self) -> str:
        return None

    def _get_fgb_file_name(self) -> str:
        return sub(rf"^{escape(settings.fgb_access_prefix)}/", "", self.get_fgb_file_path())

    def get_mvt_bytes(self, z: int, x: int, y: int) -> BytesResponse:
        try:
            s3_response = self.s3_client.get_object(
                Bucket=settings.mvt_bucket_name, Key=f"{self.get_layer_name()}/{z}/{x}/{y}.pbf"
            )
        except ClientError as e:
            if e.response["Error"]["Code"] == "404":
                raise FileNotFoundError()
            else:
                logger.exception("Unknown exception getting tile from S3", e)
                raise Exception()
        return BytesResponse(
            byte_iterator=s3_response["Body"].iter_chunks(), content_type="application/vnd.mapbox-vector-tile"
        )

    @abstractmethod
    def get_colour_hex(self) -> str:
        pass

    def get_mvt_metadata(self) -> MvtMetadataResponse:
        try:
            s3_response = self.s3_client.get_object(
                Bucket=settings.mvt_bucket_name, Key=f"{self.get_layer_name()}/metadata.json"
            )
        except ClientError as e:
            if e.response["Error"]["Code"] == "404":
                raise FileNotFoundError()
            else:
                logger.exception("Unknown exception getting tile metadata from S3", e)
                raise Exception()
        metadata_json = s3_response["Body"].read().decode("UTF-8")
        metadata = loads(metadata_json)
        return MvtMetadataResponse(
            id=self.get_layer_name(),
            minzoom=metadata["minzoom"],
            maxzoom=metadata["maxzoom"],
            fields=list(loads(metadata["json"])["vector_layers"][0]["fields"].keys()),
            colour_hex=self.get_colour_hex(),
        )
