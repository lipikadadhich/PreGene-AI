from pathlib import Path
import pandas as pd


class DatasetService:
    def __init__(self):
        self.dataset = None

    def load_dataset(self):
        dataset_path = (
            Path(__file__).resolve().parents[2]
            / "datasets"
            / "pregene_master_dataset.csv"
        )

        self.dataset = pd.read_csv(dataset_path)

        print("=" * 60)
        print("PreGene-AI Dataset Loaded Successfully")
        print(f"Rows    : {self.dataset.shape[0]}")
        print(f"Columns : {self.dataset.shape[1]}")
        print("=" * 60)

    def get_dataset(self):
        return self.dataset


dataset_service = DatasetService()
