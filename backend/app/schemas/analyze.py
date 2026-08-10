from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    imageBase64: str
    mode: str = "label"
