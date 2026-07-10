import openpyxl
from collections import Counter
from pathlib import Path

BASE = Path(__file__).parent
EXCEL = BASE / "cleaned_dengue_data.xlsx"

wb = openpyxl.load_workbook(str(EXCEL), read_only=True)
ws = wb.active

# Read headers first
headers = []
monthly_year = Counter()

for i, row in enumerate(ws.iter_rows(values_only=True)):
    row = list(row)
    if i == 0:
        headers = [str(h).strip().lower() if h else '' for h in row]
        print("Headers found:", headers)
        continue

    # Find doa column
    doa_idx = next((j for j, h in enumerate(headers)
                    if any(k in h for k in ['doa','date','admission'])), 3)

    doa = str(row[doa_idx]) if row[doa_idx] else ''

    year  = None
    month = None

    for sep in ['/', '-', '.']:
        if sep in doa:
            parts = doa.split(sep)
            if len(parts) >= 3:
                # Try dd/mm/yyyy
                try:
                    if len(parts[2]) == 4:
                        month = parts[1].zfill(2)
                        year  = parts[2]
                    # Try yyyy-mm-dd
                    elif len(parts[0]) == 4:
                        month = parts[1].zfill(2)
                        year  = parts[0]
                except:
                    pass
            break

    if month and year and month.isdigit() and 1 <= int(month) <= 12:
        monthly_year[f"{year}-{month}"] += 1

wb.close()

print("\nMonthly case counts from your 524 patients:")
print("="*40)
total = 0
for key in sorted(monthly_year):
    print(f"  {key} : {monthly_year[key]} cases")
    total += monthly_year[key]
print(f"\nTotal counted: {total} patients")