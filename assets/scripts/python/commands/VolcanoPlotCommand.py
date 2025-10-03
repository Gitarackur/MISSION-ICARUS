import json
import matplotlib.pyplot as plt
import numpy as np
import base64
from io import BytesIO
from core.Command import Command



class VolcanoPlotCommand(Command):
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

        # Expected format: {"log2fc": [values], "pvalues": [values], "labels": [optional]}
        log2fc = np.array(data['log2fc'])
        pvalues = np.array(data['pvalues'])
        labels = data.get('labels', None)
        
        # Calculate -log10(p-values)
        neg_log_pvalues = -np.log10(pvalues + 1e-300)  # Add small value to avoid log(0)
        
        # Significance thresholds
        fc_threshold = data.get('fc_threshold', 1.0)
        pval_threshold = data.get('pval_threshold', 0.05)
        neg_log_pval_threshold = -np.log10(pval_threshold)

        plt.figure(figsize=(10, 8))
        
        # Color points based on significance
        significant_up = (log2fc > fc_threshold) & (neg_log_pvalues > neg_log_pval_threshold)
        significant_down = (log2fc < -fc_threshold) & (neg_log_pvalues > neg_log_pval_threshold)
        not_significant = ~(significant_up | significant_down)
        
        plt.scatter(log2fc[not_significant], neg_log_pvalues[not_significant], 
                   c='gray', alpha=0.5, label='Not significant')
        plt.scatter(log2fc[significant_up], neg_log_pvalues[significant_up], 
                   c='red', alpha=0.6, label='Upregulated')
        plt.scatter(log2fc[significant_down], neg_log_pvalues[significant_down], 
                   c='blue', alpha=0.6, label='Downregulated')
        
        # Add threshold lines
        plt.axhline(y=neg_log_pval_threshold, color='black', linestyle='--', linewidth=0.8)
        plt.axvline(x=fc_threshold, color='black', linestyle='--', linewidth=0.8)
        plt.axvline(x=-fc_threshold, color='black', linestyle='--', linewidth=0.8)
        
        plt.xlabel('Log2 Fold Change')
        plt.ylabel('-Log10(p-value)')
        plt.title('Volcano Plot')
        plt.legend()
        plt.tight_layout()

        if preview:
            plt.show()
        else:
            buf = BytesIO()
            plt.savefig(buf, format='png')
            buf.seek(0)
            img_base64 = base64.b64encode(buf.read()).decode('utf-8')
            print(img_base64)


