from pydantic import BaseModel


class PatientRequest(BaseModel):
    disease: str
    inheritance: str

    father_carrier: bool
    mother_carrier: bool

    family_history: bool
    consanguinity: bool

    father_genotype: str
    mother_genotype: str
