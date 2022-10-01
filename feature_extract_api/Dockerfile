FROM osgeo/gdal:ubuntu-small-3.5.1

ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get update --fix-missing \
  && apt-get install -y --no-install-recommends \
     build-essential \
     curl \
     python3-dev \
     python3-pip \
  && apt-get clean

WORKDIR /app
COPY feature_extract feature_extract
COPY feature_extract_api feature_extract_api

WORKDIR /app
ARG PIP_INSTALL_ARG=""
RUN pip install -e feature_extract${PIP_INSTALL_ARG}
RUN pip install -e feature_extract_api${PIP_INSTALL_ARG}

CMD [ "uvicorn", "feature_extract_api.app:app", "--host", "0.0.0.0", "--port", "80" ]
