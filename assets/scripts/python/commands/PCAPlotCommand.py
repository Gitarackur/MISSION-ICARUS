import json
import matplotlib.pyplot as plt
import numpy as np
import base64
from io import BytesIO
from sklearn.decomposition import PCA
from core.Command import Command



class PCAPlotCommand(Command):
    def execute(self):
        preview = "--preview" in self.args
        use_json = "--use-json" in self.args
        input_arg = self.args[0]

        if use_json:
            data = json.loads(input_arg)
        else:
            try:
                with open(input_arg) as f:
                    data = json.load(f)
            except (FileNotFoundError, OSError):
                data = json.loads(input_arg)

        # Expected format: {"data": [[sample_features]], "labels": [optional]}
        features = np.array(data['data'])
        labels = data.get('labels', None)
        n_components = data.get('n_components', 2)

        # Perform PCA
        pca = PCA(n_components=n_components)
        principal_components = pca.fit_transform(features)

        plt.figure(figsize=(10, 8))
        
        if labels:
            unique_labels = list(set(labels))
            for label in unique_labels:
                indices = [i for i, l in enumerate(labels) if l == label]
                plt.scatter(principal_components[indices, 0], 
                           principal_components[indices, 1], 
                           label=label, alpha=0.6, s=50)
            plt.legend()
        else:
            plt.scatter(principal_components[:, 0], 
                       principal_components[:, 1], 
                       alpha=0.6, s=50)
        
        variance = pca.explained_variance_ratio_
        plt.xlabel(f'PC1 ({variance[0]:.2%} variance)')
        plt.ylabel(f'PC2 ({variance[1]:.2%} variance)')
        plt.title('PCA Plot')
        plt.grid(True, alpha=0.3)
        plt.tight_layout()

        if preview:
            plt.show()
        else:
            buf = BytesIO()
            plt.savefig(buf, format='png')
            buf.seek(0)
            img_base64 = base64.b64encode(buf.read()).decode('utf-8')
            print(img_base64)