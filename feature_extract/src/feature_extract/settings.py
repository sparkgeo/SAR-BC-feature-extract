from tempfile import gettempdir

from pydantic import BaseSettings


class _Settings(BaseSettings):
    out_data_dir: str = gettempdir()
    fgb_access_prefix: str
    mbt_bucket_name: str
    # GDAL / OGR settings, no control over naming
    AWS_S3_ENDPOINT: str = None
    AWS_HTTPS: str = "YES"
    AWS_VIRTUAL_HOSTING: str = None


settings = _Settings()
