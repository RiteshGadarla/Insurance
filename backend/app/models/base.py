from pydantic import BaseModel, Field
from typing import Optional
from bson import ObjectId

class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, values=None, config=None, field=None):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return str(v)

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema([
                core_schema.is_instance_schema(ObjectId),
                core_schema.str_schema(),
            ], serialization=core_schema.plain_serializer_function_ser_schema(lambda x: str(x))),
        )

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler):
        return {"type": "string"}

class MongoModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
        "json_schema_extra": {
            "example": {
                "id": "507f1f77bcf86cd799439011",
            }
        }
    }

    def model_dump(self, **kwargs):
        # Ensure 'id' is mapped to '_id' for mongo if needed, 
        # but also ensure 'id' exists in the output if requested.
        d = super().model_dump(**kwargs)
        if "_id" in d and "id" not in d:
            d["id"] = str(d["_id"])
        elif "id" in d and "_id" not in d:
            d["_id"] = ObjectId(d["id"]) if ObjectId.is_valid(d["id"]) else d["id"]
        return d
