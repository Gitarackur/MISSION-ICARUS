import matplotlib.pyplot as plt
import numpy as np
import base64
from io import BytesIO
from sklearn.decomposition import PCA
from core.Command import Command
from commands.utils import (
    apply_axis_tick_settings,
    apply_grid_settings,
    get_display_settings,
    load_payload,
)



class PCAPlotCommand(Command):
    def execute(self):
        preview = "--preview" in self.args
        use_json = "--use-json" in self.args
        input_arg = self.args[0]

        data = load_payload(input_arg, use_json)

        # Expected format: {"data": [[sample_features]], "labels": [optional]}
        features = np.array(data['data'])
        labels = data.get('labels', None)
        groups = data.get('groups', None)
        n_components = data.get('n_components', 2)

        # Perform PCA
        pca = PCA(n_components=n_components)
        principal_components = pca.fit_transform(features)

        settings = get_display_settings(data)
        dpi = 100
        figure, axis = plt.subplots(
            figsize=(settings['width'] / dpi, settings['height'] / dpi),
            dpi=dpi,
        )
        
        if groups:
            unique_labels = list(dict.fromkeys(groups))
            for group_index, label in enumerate(unique_labels):
                indices = [i for i, l in enumerate(groups) if l == label]
                axis.scatter(principal_components[indices, 0],
                             principal_components[indices, 1],
                             label=label, alpha=0.65,
                             s=settings['point_size'] ** 2,
                             color=settings['colors'][group_index % len(settings['colors'])],
                             edgecolors='none')
            axis.legend(
                ncols=min(3, len(unique_labels)),
                fontsize=settings['tick_font_size'],
                frameon=False,
            )
        else:
            axis.scatter(principal_components[:, 0],
                         principal_components[:, 1],
                         alpha=0.65, s=settings['point_size'] ** 2,
                         color=settings['colors'][0], edgecolors='none')
        
        variance = pca.explained_variance_ratio_
        axis.set_xlabel(
            settings['x_axis_label'] or f'PC1 ({variance[0]:.2%} variance)',
            fontsize=settings['axis_label_font_size'],
            loc='center',
        )
        axis.set_ylabel(
            settings['y_axis_label'] or f'PC2 ({variance[1]:.2%} variance)',
            fontsize=settings['axis_label_font_size'],
            loc='center',
        )
        axis.set_title(data.get('title', 'PCA Plot'), pad=12)
        axis.tick_params(axis='both', labelsize=settings['tick_font_size'])
        apply_grid_settings(axis, settings)
        apply_axis_tick_settings(axis, settings, numeric_x=True, numeric_y=True)
        axis.set_axisbelow(True)
        figure.tight_layout(pad=1.4)

        if preview:
            plt.show()
        else:
            buf = BytesIO()
            figure.savefig(buf, format='png', dpi=dpi)
            plt.close(figure)
            buf.seek(0)
            img_base64 = base64.b64encode(buf.read()).decode('utf-8')
            print(img_base64)
