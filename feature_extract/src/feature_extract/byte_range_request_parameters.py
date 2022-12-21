from feature_extract.dataset_request_parameters import DatasetRequestParameters


class ByteRangeRequestParameters(DatasetRequestParameters):

    range_start: int
    range_end: int
