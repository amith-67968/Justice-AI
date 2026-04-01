"""
Quick test script for JusticeAI backend APIs.
Run: python test_api.py  (while the server is running on localhost:8000)
"""

import json
import sys

import requests

BASE_URL = "http://localhost:8000"
VALID_STRENGTHS = {"Weak", "Moderate", "Strong"}
VALID_DIFFICULTIES = {"Easy", "Moderate", "Hard"}


def header(title: str):
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print(f"{'=' * 60}")


def test_health():
    header("Health Check")
    r = requests.get(f"{BASE_URL}/health")
    print(f"Status: {r.status_code}")
    print(json.dumps(r.json(), indent=2))
    assert r.status_code == 200


def test_chat():
    header("Chat — Legal Question")
    payload = {
        "user_query": "My landlord is not returning my security deposit after I vacated the flat. What are my legal rights in India?"
    }
    r = requests.post(f"{BASE_URL}/chat", json=payload)
    print(f"Status: {r.status_code}")
    print(json.dumps(r.json(), indent=2))
    assert r.status_code == 200


def test_upload_text():
    header("Upload — Text File (simulated legal document)")
    # Create a sample legal document in memory
    sample_doc = """
CONSUMER COMPLAINT

Complaint No: CC/2024/001234
Filed on: 15/03/2024

Before the District Consumer Disputes Redressal Forum, Mumbai

COMPLAINANT:
Mr. Rajesh Kumar Sharma
S/o Shri Mohan Lal Sharma
Address: 45, Green Park Colony, Andheri West, Mumbai - 400058

RESPONDENT:
M/s TechGadgets India Pvt. Ltd.
Registered Office: Plot No. 23, Electronic City, Bengaluru - 560100

FACTS OF THE CASE:

1. The complainant purchased a laptop (Model: TG Pro 2024, Serial No: TG2024-78956)
   from the respondent's online store on 10/01/2024 for Rs. 85,000/- (Rupees Eighty Five
   Thousand only).

2. Payment was made via UPI transaction (Ref: UPI/2024/0110/789456123) on 10/01/2024.

3. The laptop was delivered on 15/01/2024 and was found to have the following defects:
   a) Screen flickering within 3 days of use
   b) Battery draining within 2 hours despite manufacturer claim of 10 hours
   c) Keyboard keys (A, S, D) not functioning

4. The complainant contacted the respondent's customer care on 20/01/2024 (Ticket No: TC-2024-5678)
   but received no resolution despite multiple follow-ups on 25/01/2024 and 02/02/2024.

5. The complainant sent a legal notice via registered post on 15/02/2024 (AD No: RM789012345IN)
   demanding replacement or full refund. The respondent failed to respond within 30 days.

PRAYER:
The complainant prays for:
a) Full refund of Rs. 85,000/- with interest at 12% per annum
b) Compensation of Rs. 25,000/- for mental agony and harassment
c) Cost of litigation Rs. 10,000/-

DOCUMENTS ATTACHED:
1. Purchase invoice dated 10/01/2024
2. UPI payment receipt
3. Delivery receipt dated 15/01/2024
4. Customer care ticket screenshots
5. Legal notice with postal receipt
6. Photos of defective laptop

Date: 15/03/2024
Place: Mumbai

Signature of Complainant: [SIGNED]
Rajesh Kumar Sharma
""".strip()

    # Send as a text file upload
    files = {"file": ("consumer_complaint.txt", sample_doc.encode(), "text/plain")}
    r = requests.post(f"{BASE_URL}/upload", files=files)
    print(f"Status: {r.status_code}")
    data = r.json()
    # Print structured data (not the full extracted text for brevity)
    print("Structured Data:")
    print(json.dumps(data.get("structured_data", {}), indent=2))
    print(f"\nCase Type: {data.get('structured_data', {}).get('case_type', 'N/A')}")
    print(f"Evidence Strength: {data.get('structured_data', {}).get('evidence_strength', 'N/A')}")
    assert r.status_code == 200
    return data


def test_analyze(upload_data: dict = None):
    header("Analyze — Case Analysis")
    # Use data from upload, or provide sample
    structured = upload_data.get("structured_data", {}) if upload_data else {
        "document_type": "Consumer Complaint",
        "parties": [
            {"name": "Rajesh Kumar Sharma", "role": "complainant"},
            {"name": "TechGadgets India Pvt. Ltd.", "role": "respondent"},
        ],
        "dates": ["10/01/2024", "15/01/2024", "15/03/2024"],
        "monetary_values": ["Rs. 85,000/-", "Rs. 25,000/-", "Rs. 10,000/-"],
        "key_clauses": ["refund demanded", "defective product", "legal notice sent"],
        "missing_elements": [],
        "evidence_strength": "Strong",
        "reason": "Multiple supporting documents attached including payment proof and legal notice",
        "case_type": "Consumer Dispute",
    }

    payload = {
        "structured_data": structured,
        "documents": upload_data.get("documents") if upload_data else None,
    }
    r = requests.post(f"{BASE_URL}/analyze", json=payload)
    print(f"Status: {r.status_code}")
    data = r.json()
    print(json.dumps(data, indent=2))
    assert r.status_code == 200

    assert data.get("case_strength") in VALID_STRENGTHS
    assert data.get("case_difficulty") in VALID_DIFFICULTIES

    for document in data.get("document_analysis", []):
        assert document.get("evidence_strength") in VALID_STRENGTHS

    print(f"\nCase Strength: {data.get('case_strength', 'N/A')}")
    print(f"Case Difficulty: {data.get('case_difficulty', 'N/A')}")
    print(f"Confidence Score: {data.get('confidence_score', 'N/A')}")
    return data


def test_extract_events():
    header("Extract Events")
    payload = {
        "text": """
        The agreement was signed on 10th January 2024 between the parties.
        The first installment of Rs. 50,000 was due on 01/02/2024.
        A legal notice was dispatched on March 15, 2024 via registered post.
        The hearing is scheduled for 20/05/2024 at the District Court.
        The limitation period expires on 10-01-2027.
        """
    }
    r = requests.post(f"{BASE_URL}/extract-events", json=payload)
    print(f"Status: {r.status_code}")
    print(json.dumps(r.json(), indent=2))
    assert r.status_code == 200


if __name__ == "__main__":
    print("🧪 JusticeAI API Test Suite")
    print(f"   Target: {BASE_URL}")

    try:
        test_health()
        test_chat()
        upload_data = test_upload_text()
        test_analyze(upload_data)
        test_extract_events()

        header("ALL TESTS PASSED ✅")
    except requests.ConnectionError:
        print(f"\n❌ Cannot connect to {BASE_URL}")
        print("   Make sure the server is running: python main.py")
        sys.exit(1)
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)
