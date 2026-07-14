def autosomal_recessive(parent1, parent2):

    p1 = parent1.strip()
    p2 = parent2.strip()

    if p1 == "AA" and p2 == "AA":
        return {
            "Healthy": 100,
            "Carrier": 0,
            "Affected": 0
        }

    elif (
        (p1 == "AA" and p2 == "Aa") or
        (p1 == "Aa" and p2 == "AA")
    ):
        return {
            "Healthy": 50,
            "Carrier": 50,
            "Affected": 0
        }

    elif p1 == "Aa" and p2 == "Aa":
        return {
            "Healthy": 25,
            "Carrier": 50,
            "Affected": 25
        }

    elif (
        (p1 == "Aa" and p2 == "aa") or
        (p1 == "aa" and p2 == "Aa")
    ):
        return {
            "Healthy": 0,
            "Carrier": 50,
            "Affected": 50
        }

    elif (
        (p1 == "AA" and p2 == "aa") or
        (p1 == "aa" and p2 == "AA")
    ):
        # Homozygous unaffected x homozygous affected: every offspring
        # inherits one A and one a, so all are carriers.
        return {
            "Healthy": 0,
            "Carrier": 100,
            "Affected": 0
        }

    elif p1 == "aa" and p2 == "aa":
        return {
            "Healthy": 0,
            "Carrier": 0,
            "Affected": 100
        }

    # Truly invalid genotype strings (anything other than AA/Aa/aa) still
    # return the SAME shape as every valid case above, instead of a
    # single-key error dict. This guarantees report_service.py and any
    # other caller can always safely read Healthy/Carrier/Affected,
    # regardless of what was typed into the genotype fields.
    return {
        "Healthy": None,
        "Carrier": None,
        "Affected": None,
        "Error": "Invalid genotype. Use only AA, Aa or aa.",
    }