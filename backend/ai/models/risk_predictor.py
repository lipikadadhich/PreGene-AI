from ai.utils.constants import (
    AUTOSOMAL_RECESSIVE,
    AUTOSOMAL_DOMINANT,
    X_LINKED_RECESSIVE,
    HIGH,
    MEDIUM,
    LOW,
)


def predict_risk(
    inheritance,
    father_carrier,
    mother_carrier,
    family_history,
    consanguinity,
):
    """
    Predict genetic risk score and risk level based on
    inheritance pattern and parental information.
    """

    score = 0

    # ---------------------------------------
    # Inheritance Type
    # ---------------------------------------

    if inheritance == AUTOSOMAL_RECESSIVE:
        score += 20

    elif inheritance == AUTOSOMAL_DOMINANT:
        score += 15

    elif inheritance == X_LINKED_RECESSIVE:
        score += 18

    # ---------------------------------------
    # Carrier Status
    # ---------------------------------------

    if father_carrier:
        score += 20

    if mother_carrier:
        score += 20

    if father_carrier and mother_carrier:
        score += 25

    # ---------------------------------------
    # Family History
    # ---------------------------------------

    if family_history:
        score += 10

    # ---------------------------------------
    # Consanguinity
    # ---------------------------------------

    if consanguinity:
        score += 5

    # ---------------------------------------
    # Limit Score
    # ---------------------------------------

    score = min(score, 100)

    # ---------------------------------------
    # Risk Classification
    # ---------------------------------------

    if score >= 75:
        level = "HIGH"

    elif score >= 40:
        level = "MEDIUM"

    else:
        level = "LOW"

    return score, level
