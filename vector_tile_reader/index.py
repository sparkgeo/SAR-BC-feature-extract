from json import dumps
from os import path
from re import compile as compile_regex
from sqlite3 import connect as sqlite_connect
from tempfile import gettempdir

from boto3 import client as boto_client

client = boto_client("s3")
s3_url_regex = compile_regex(r"^.+://[^/]+/([a-zA-Z_]+/\d{1,2}/\d+/\d+).*")


def handler(event, context):
    event_object = event["getObjectContext"]
    s3_url = event_object["inputS3Url"]

    try:
        s3_url_matches = s3_url_regex.match(s3_url)
        if s3_url_matches:
            dataset, z, x, y = s3_url_matches.group(1).split("/")
            dataset_filename = f"{dataset}.mbtiles"
            dataset_path = path.join(gettempdir(), dataset_filename)
            if path.exists(dataset_path):
                print(f"{dataset_path} already exists")
            else:
                print(f"{dataset_path} does not exist, fetching")
                client.download_file(
                    Bucket="mbt-data",
                    Key=f"{dataset}.mbtiles",
                    Filename=dataset_path,
                )
                print("fetched")
            print("creating sqlite connection")
            dataset_connection = sqlite_connect(dataset_path)
            tile_row = dataset_connection.execute(
                "select tile_data from tiles where zoom_level = ? and tile_column = ? and tile_row = ?",
                (z, x, y),
            ).fetchone()
            if tile_row is None:
                print("no data returned for tile ID")
                response = dumps({"error": f"tile not found in {dataset}: {z}/{x}/{y}"})
            else:
                print("tile data returned, including in response")
                response = tile_row[0]

        else:
            print(f"{s3_url} does not match URL regex")
            response = dumps({"error": f"S3 URL does not match pattern: {s3_url}"})
    except Exception as e:
        print(e)
        response = str(e)

    client.write_get_object_response(
        RequestRoute=event_object["outputRoute"],
        RequestToken=event_object["outputToken"],
        Body=response,
    )
