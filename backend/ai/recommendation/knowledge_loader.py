import pandas as pd

from config import KNOWLEDGE_BASE


class KnowledgeBase:

    def __init__(self):
        self.df = pd.read_csv(KNOWLEDGE_BASE)

    def get_disease(self, disease_name):

        result = self.df[
            self.df["Disease"].str.lower() == disease_name.lower()
        ]

        if result.empty:
            return None

        return result.iloc[0].to_dict()

    def get_gene(self, gene):

        result = self.df[
            self.df["Gene"].str.lower() == gene.lower()
        ]

        if result.empty:
            return None

        return result.iloc[0].to_dict()

    def get_all(self):
        return self.df
