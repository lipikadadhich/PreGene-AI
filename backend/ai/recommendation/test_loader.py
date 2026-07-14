from ai.recommendation.knowledge_loader import KnowledgeBase

kb = KnowledgeBase()

disease = input("Enter Disease Name: ")

result = kb.get_disease(disease)

if result is None:
    print("Disease Not Found")

else:
    print("\nDisease Information\n")

    for key, value in result.items():
        print(f"{key} : {value}")
