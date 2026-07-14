
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

    elif p1 == "aa" and p2 == "aa":
        return {
            "Healthy": 0,
            "Carrier": 0,
            "Affected": 100
        }

    return {
        "Error": "Invalid genotype. Use only AA, Aa or aa."
    }
