from ai.models.risk_predictor import predict_risk

inheritance = input("Inheritance Type : ")

father = input("Father Carrier (y/n): ").lower() == "y"
mother = input("Mother Carrier (y/n): ").lower() == "y"
history = input("Family History (y/n): ").lower() == "y"
consanguinity = input("Consanguinity (y/n): ").lower() == "y"

score, level = predict_risk(
    inheritance,
    father,
    mother,
    history,
    consanguinity,
)

print("\n========== RESULT ==========\n")
print("Risk Score :", score)
print("Risk Level :", level)
