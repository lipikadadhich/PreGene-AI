def choose_editing_method(mutation_type):

    mutation = mutation_type.lower()

    if "missense" in mutation:
        return "Base Editing"

    elif "nonsense" in mutation:
        return "Prime Editing"

    elif "frameshift" in mutation:
        return "Prime Editing"

    elif "deletion" in mutation:
        return "Exon Skipping / Gene Replacement"

    elif "repeat" in mutation:
        return "CRISPR Gene Silencing"

    elif "inversion" in mutation:
        return "CRISPR HDR"

    return "Further Genetic Analysis Required"
