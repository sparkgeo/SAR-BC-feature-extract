import json

from feature_extract.common import get_dataset_providers


def execute(
    output_path: str,
) -> None:
    config = {}
    for provider in get_dataset_providers():
        config[provider.get_layer_name()] = {
            "field_names": provider.get_required_field_names(),
            "filter_query": provider.get_filter_query(),
        }
    with open(output_path, "w") as f:
        f.write(json.dumps(config))


if __name__ == "__main__":
    from argparse import ArgumentParser

    parser = ArgumentParser()
    parser.add_argument("output_path")
    execute(parser.parse_args().output_path)
