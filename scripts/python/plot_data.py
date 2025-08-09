import sys
import json
import matplotlib.pyplot as plt
import base64
from io import BytesIO

def main():
    data_file = sys.argv[1]
    with open(data_file) as f:
        data = json.load(f)

    labels = list(data.keys())
    values = list(data.values())

    plt.figure(figsize=(6,4))
    plt.bar(labels, values)
    plt.title('Python Bar Chart')
    plt.tight_layout()

    buf = BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)

    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    print(img_base64)

if __name__ == "__main__":
    main()
