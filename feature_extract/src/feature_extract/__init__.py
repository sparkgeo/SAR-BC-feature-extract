import logging
from glob import glob
from importlib import import_module
from os import environ, path
from re import sub
from sys import stdout

from osgeo.ogr import UseExceptions

_current_path = path.dirname(__file__)
_current_dirname = _current_path.split(path.sep)[-1]

for file_path in [
    filename
    for filename in glob(path.join(_current_path, "datasets", "providers", "**", "*.py"), recursive=True)
    if filename != "__init__.py"
]:
    module_path = sub(r"^/", "", path.dirname(file_path).replace(_current_path, ""))
    if module_path == "":
        continue  # don't attempt to import anything from current
    module_name = path.basename(file_path)[:-3]
    module_str = f"{_current_dirname}.{path.sep.join([module_path, module_name]).replace(path.sep, '.')}"
    try:
        module = import_module(module_str)
    except ImportError as e:
        raise Exception(f"unable to import module '{module_str}': {e}")

requestedLogLevel = environ.get("LOG_LEVEL", "info")
logLevelMapping = {
    "debug": logging.DEBUG,
    "info": logging.INFO,
    "warn": logging.WARN,
    "error": logging.ERROR,
}
handlers = [
    logging.StreamHandler(stream=stdout),
]
logging.basicConfig(
    handlers=handlers,
    level=logLevelMapping.get(requestedLogLevel, logging.INFO),
    format="%(levelname)s %(asctime)s %(message)s",
)

UseExceptions()
