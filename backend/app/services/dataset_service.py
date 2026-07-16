import pandas as pd
import os

class DatasetService:
    def __init__(self):
        self._df = None

    def load_dataset(self):
        """Loads the dataset into memory on startup."""
        print("Loading disease dataset...")
        try:
            # Note: Adjust this path if your CSV is saved somewhere else!
            dataset_path = os.path.join(os.path.dirname(__file__), "../../datasets/pregene_master_dataset.csv")
            self._df = pd.read_csv(dataset_path)
            print(f"Successfully loaded {len(self._df)} records.")
        except Exception as e:
            print(f"Error loading dataset: {e}")
            # Create an empty dataframe so the app doesn't crash completely
            self._df = pd.DataFrame(columns=["Disease", "Gene", "Gene_Name", "Age_Of_Onset", "Inheritance_Type"])

    def get_dataset(self) -> pd.DataFrame:
        """Returns the loaded dataset."""
        if self._df is None:
            self.load_dataset()
        return self._df

def clean_record(record: dict) -> dict:
    """Removes NaN values from a dictionary record."""
    cleaned = {}
    for key, value in record.items():
        if pd.isna(value):
            cleaned[key] = None
        else:
            cleaned[key] = value
    return cleaned

# Create a single instance to be imported by other files
dataset_service = DatasetService()