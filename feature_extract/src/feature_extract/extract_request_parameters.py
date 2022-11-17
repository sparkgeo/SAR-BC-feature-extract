from feature_extract.dataset_request_parameters import DatasetRequestParameters


class ExtractRequestParameters(DatasetRequestParameters):

    lat_min: float
    lat_max: float
    lon_min: float
    lon_max: float
