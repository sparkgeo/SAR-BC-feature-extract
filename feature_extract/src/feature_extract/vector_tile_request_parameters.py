from feature_extract.dataset_request_parameters import DatasetRequestParameters


class VectorTileRequestParameters(DatasetRequestParameters):
    z: int
    x: int
    y: int
