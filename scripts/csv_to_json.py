import csv
import json

csv_path = "data/OM-3 Recipes - Color recipes.csv"
json_path = "data/om3-recipes.json"

def csv_to_json(csv_path, json_path):
    with open(csv_path, mode='r', encoding='utf-8') as csvfile:
        rows = list(csv.reader(csvfile))
        if len(rows) < 2:
            raise Exception("CSV does not have enough rows")
        # The first row (categories) is ignored, second row is headers
        headers = rows[1]
        data_rows = rows[2:]
        json_array = []
        for row in data_rows:
            # Support for short/empty rows (pad)
            if len(row) < len(headers):
                row += [""] * (len(headers) - len(row))
            json_array.append({headers[i]: row[i] for i in range(len(headers))})
    with open(json_path, mode='w', encoding='utf-8') as jsonfile:
        json.dump(json_array, jsonfile, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    csv_to_json(csv_path, json_path)
    print(f"Converted '{csv_path}' to '{json_path}'.")
