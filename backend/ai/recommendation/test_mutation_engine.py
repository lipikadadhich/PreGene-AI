from mutation_engine import choose_editing_method

mutation = input("Mutation Type : ")

method = choose_editing_method(mutation)

print("\nRecommended Editing Method\n")

print(method)
