import json
from bson import ObjectId
from typing import Any

class MongoJSONEncoder(json.JSONEncoder):
    def default(self, o: Any) -> Any:
        if isinstance(o, ObjectId):
            return str(o)
        return super().default(o)
