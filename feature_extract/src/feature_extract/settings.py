from tempfile import gettempdir

from pydantic import BaseSettings


class _Settings(BaseSettings):
    out_data_dir: str = gettempdir()
    fgb_access_prefix: str
    mvt_bucket_name: str
    s3_endpoint: str = None


settings = _Settings()
