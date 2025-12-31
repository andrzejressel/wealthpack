import re
from dataclasses import dataclass
from typing import List

import pypdfium2 as pdfium
import requests

market_suffix_map = {
    'Xetra': '.DE',
    'LSE': '.L',
    'NSQ': None,
    'NYSE': None,
    'NYSE-MKT': None,
    'TSX': '.TO',
    'AMS': '.AS',
    'PAR': '.PA',
    'BRU': '.BR',
    'SWX': '.SW'
}


@dataclass(frozen=True)
class SecurityDetails:
    isin: str
    full_ticker: str

def extract_securities_from_pdf(file_path: str) -> List[SecurityDetails]:
    """
    Opens a PDF file, extracts text from all pages, and finds all occurrences
    of the Broker/ISIN/Ticker pattern.
    """

    extracted_data: List[SecurityDetails] = []

    # Regex: Broker (non-space) -> Space -> ISIN (Strict) -> Space -> Ticker (non-space)
    regex_pattern: str = r"(?P<broker>\S+)\s+(?P<isin>[A-Z]{2}[A-Z0-9]{9}\d)\s+(?P<ticker>\S+)"

    try:
        # Load the PDF document
        pdf = pdfium.PdfDocument(file_path)

        # Iterate through every page in the PDF
        for i, page in enumerate(pdf):

            # Load the text page object
            text_page = page.get_textpage()

            # Extract all text from the page as a single string
            text_content: str = text_page.get_text_range()

            # Find all matches in this page's text
            # finditer is better than search because it finds *all* rows on the page
            for match in re.finditer(regex_pattern, text_content):
                broker_id = match.group("broker")
                isin = match.group("isin")
                ticker = match.group("ticker")

                if broker_id not in market_suffix_map:
                    raise f"Unknown broker ID found in PDF: {broker_id}"

                suffix = market_suffix_map[broker_id]

                if suffix:
                    full_ticker = f"{ticker}{suffix}"
                else:
                    full_ticker = ticker

                security = SecurityDetails(
                    full_ticker=full_ticker,
                    isin=isin,
                )
                extracted_data.append(security)

            # Clean up page resources (optional but good practice with C-bindings)
            text_page.close()
            page.close()

        return extracted_data

    except Exception as e:
        print(f"Error processing PDF: {e}")
        return []


# --- Usage Example ---
if __name__ == "__main__":
    url = "https://bossa.pl/sites/b30/files/2025-08/document/Lista%20wszystkich%20instrument%C3%B3w%20zagranicznych%2026082025.pdf"
    content = requests.get(url).content

    print(f"Reading file: [{url}]...")
    results: List[SecurityDetails] = extract_securities_from_pdf(content)

    map = {}
    for item in results:
        map[item.isin] = item.full_ticker


    final_file = """
const isin_to_ticker = new Map([
""" + ",\n".join([f'    ["{key}", "{value}"]' for key, value in dict(sorted(map.items())).items()]) + """
]);
export default isin_to_ticker;
    """

    with open("../isin_to_ticker.ts", "w", encoding="utf-8") as f:
        f.write(final_file)
